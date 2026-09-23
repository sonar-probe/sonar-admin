import NodeSelectorDialog from "@/admin-ui/components/NodeSelectorDialog";
import { usePingTask, type PingTask } from "@/admin-ui/contexts/PingTaskContext";
import { Button, Checkbox, Flex, Switch } from "@radix-ui/themes";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// 内置监测节点：全国 31 省市三网延迟检测预设。数据来自 zstaticcdn.com，
// 由服务端 public:getBuiltinPingPresets 统一维护（省份/运营商代码表 +
// 固定域名模板），这里只负责把管理员的勾选变成对
// admin:applyBuiltinPingPresets 的一次调用，不在前端拼 target 字符串。

interface Province {
  code: string;
  name: string;
}

interface Carrier {
  code: string;
  name: string;
}

interface PresetNode {
  province_code: string;
  province_name: string;
  carrier_code: string;
  carrier_name: string;
  ip_version: number;
  name: string;
  target: string;
}

interface PresetsResponse {
  provinces: Province[];
  carriers: Carrier[];
  nodes_v4: PresetNode[];
  nodes_v6: PresetNode[];
  credit: string;
  credit_url: string;
}

function nodeKey(provinceCode: string, carrierCode: string) {
  return `${provinceCode}-${carrierCode}`;
}

export const BuiltinView = ({ pingTasks }: { pingTasks: PingTask[] }) => {
  const { t } = useTranslation();
  const { refresh } = usePingTask();

  const [presets, setPresets] = React.useState<PresetsResponse | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [servers, setServers] = React.useState<string[]>([]);
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [alsoIPv6, setAlsoIPv6] = React.useState(false);
  const [applying, setApplying] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/task/ping/builtin-presets")
      .then((res) => {
        if (!res.ok) throw new Error(t("common.error"));
        return res.json();
      })
      .then((resp: { data: PresetsResponse }) => setPresets(resp.data))
      .catch((err) => setLoadError(err.message || t("common.error")));
  }, [t]);

  // target -> PingTask，用来判断某个内置节点是否已经存在，以及是否已经
  // 绑定了当前选中的这些服务器（复用现有任务，不重复建）。
  const taskByTarget = React.useMemo(() => {
    const map = new Map<string, PingTask>();
    for (const task of pingTasks) {
      if (task.target) map.set(task.target, task);
    }
    return map;
  }, [pingTasks]);

  // 某个 (省份, 运营商) 对当前选中的服务器集合是否"已经全部开启"/"部分开启"。
  const appliedState = React.useCallback(
    (node: PresetNode): "all" | "some" | "none" => {
      if (servers.length === 0) return "none";
      const task = taskByTarget.get(node.target);
      if (!task) return "none";
      const clients = task.clients ?? [];
      const appliedCount = servers.filter((s) => clients.includes(s)).length;
      if (appliedCount === 0) return "none";
      if (appliedCount === servers.length) return "all";
      return "some";
    },
    [servers, taskByTarget]
  );

  const provinces = presets?.provinces ?? [];
  const carriers = presets?.carriers ?? [];
  const nodeByKey = React.useMemo(() => {
    const map = new Map<string, PresetNode>();
    for (const n of presets?.nodes_v4 ?? []) map.set(nodeKey(n.province_code, n.carrier_code), n);
    return map;
  }, [presets]);

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectByCarrier = (carrierCode: string | null) => {
    if (carrierCode === null) {
      setChecked(new Set());
      return;
    }
    const next = new Set<string>();
    for (const p of provinces) next.add(nodeKey(p.code, carrierCode));
    setChecked(next);
  };

  const selectAll = () => {
    const next = new Set<string>();
    for (const p of provinces) {
      for (const c of carriers) next.add(nodeKey(p.code, c.code));
    }
    setChecked(next);
  };

  const handleApply = () => {
    if (servers.length === 0) {
      toast.error(t("ping.builtin_select_servers_first"));
      return;
    }
    if (checked.size === 0) {
      toast.error(t("ping.builtin_select_nodes_first"));
      return;
    }
    const nodes: { province_code: string; carrier_code: string; ip_version: number }[] = [];
    for (const key of checked) {
      const node = nodeByKey.get(key);
      if (!node) continue;
      nodes.push({ province_code: node.province_code, carrier_code: node.carrier_code, ip_version: 4 });
      if (alsoIPv6) {
        nodes.push({ province_code: node.province_code, carrier_code: node.carrier_code, ip_version: 6 });
      }
    }

    setApplying(true);
    fetch("/api/admin/ping/apply-builtin-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, clients: servers }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data?.message || t("common.error"));
          });
        }
        return res.json();
      })
      .then((resp: { data: { created: number; updated: number } }) => {
        toast.success(
          t("ping.builtin_applied_result", {
            created: resp.data?.created ?? 0,
            updated: resp.data?.updated ?? 0,
          })
        );
        refresh();
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setApplying(false));
  };

  if (loadError) {
    return <div className="text-red-500">{loadError}</div>;
  }
  if (!presets) {
    return <div>{t("loading")}</div>;
  }

  return (
    <Flex direction="column" gap="4" className="km-pingtask-builtin">
      <Flex justify="between" align="center" wrap="wrap" gap="3">
        <Flex align="center" gap="2">
          <NodeSelectorDialog value={servers} onChange={setServers}>
            <Button variant="soft">{t("ping.builtin_select_servers")}</Button>
          </NodeSelectorDialog>
          <label className="text-sm text-gray-600">
            {t("common.selected", { count: servers.length })}
          </label>
        </Flex>
        <Flex align="center" gap="2">
          <Switch checked={alsoIPv6} onCheckedChange={setAlsoIPv6} />
          <span className="text-sm">{t("ping.builtin_also_ipv6")}</span>
        </Flex>
      </Flex>

      <Flex gap="2" wrap="wrap">
        <Button size="1" variant="soft" onClick={selectAll}>
          {t("common.select_all")}
        </Button>
        <Button size="1" variant="soft" onClick={() => selectByCarrier(null)}>
          {t("common.deselect_all")}
        </Button>
        {carriers.map((c) => (
          <Button
            key={c.code}
            size="1"
            variant="outline"
            onClick={() => selectByCarrier(c.code)}
          >
            {t("ping.builtin_only_carrier", { carrier: c.name })}
          </Button>
        ))}
      </Flex>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 km-pingtask-builtin-grid">
        {provinces.map((p) => (
          <div
            key={p.code}
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
          >
            <div className="font-medium mb-2">{p.name}</div>
            <Flex gap="3" wrap="wrap">
              {carriers.map((c) => {
                const key = nodeKey(p.code, c.code);
                const node = nodeByKey.get(key);
                const state = node ? appliedState(node) : "none";
                return (
                  <label
                    key={c.code}
                    className="flex items-center gap-1.5 text-sm cursor-pointer"
                    title={
                      state === "all"
                        ? t("ping.builtin_already_applied")
                        : state === "some"
                          ? t("ping.builtin_partially_applied")
                          : undefined
                    }
                  >
                    <Checkbox
                      checked={
                        checked.has(key)
                          ? true
                          : state === "some"
                            ? "indeterminate"
                            : state === "all"
                          }
                      onCheckedChange={() => toggle(key)}
                    />
                    <span>{c.name}</span>
                  </label>
                );
              })}
            </Flex>
          </div>
        ))}
      </div>

      <Flex justify="between" align="center" wrap="wrap" gap="2">
        <span className="text-xs text-gray-500">
          {t("ping.builtin_disclaimer")}
          {" · "}
          <a href={presets.credit_url} target="_blank" rel="noreferrer" className="underline">
            {presets.credit}
          </a>
        </span>
        <Button onClick={handleApply} disabled={applying}>
          {t("common.apply")}
        </Button>
      </Flex>
    </Flex>
  );
};
