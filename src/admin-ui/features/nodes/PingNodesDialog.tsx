import { Button, Checkbox, Dialog, Flex, TextField } from "@radix-ui/themes";
import { Radar } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useBuiltinPingPresets } from "@/admin-ui/hooks/useBuiltinPingPresets";
import type { PingTask } from "@/admin-ui/contexts/PingTaskContext";

// "设置监测节点"弹窗：从服务器列表打开，一台服务器一个弹窗，内置节点
// （全国31省市三网）用勾选网格，用户自建的任务用列表，两块合在一个弹窗里，
// 提交时全量同步（勾了的加进这台服务器，没勾的从这台服务器移除）。
// 内置节点的探测间隔是这次勾选批量共用的一个值，不是逐个节点单独设置——
// 因为内置节点是跨服务器共享的同一条 PingTask，这里改间隔会连带影响绑在
// 同一条任务上的其它服务器。

function nodeKey(provinceCode: string, carrierCode: string) {
  return `${provinceCode}-${carrierCode}`;
}

export const PingNodesButton: React.FC<{ nodeUuid: string; nodeName: string }> = ({
  nodeUuid,
  nodeName,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <button
          type="button"
          title={t("pingNodes.button", "设置监测节点")}
          aria-label={t("pingNodes.button", "设置监测节点")}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Radar size={18} />
        </button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="860px">
        <Dialog.Title>
          {t("pingNodes.title", "设置监测节点")} · {nodeName}
        </Dialog.Title>
        {open && (
          <PingNodesForm nodeUuid={nodeUuid} onDone={() => setOpen(false)} />
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
};

const PingNodesForm: React.FC<{ nodeUuid: string; onDone: () => void }> = ({
  nodeUuid,
  onDone,
}) => {
  const { t } = useTranslation();
  const { presets, loading: presetsLoading, error: presetsError } =
    useBuiltinPingPresets();

  const [allTasks, setAllTasks] = React.useState<PingTask[] | null>(null);
  const [tasksError, setTasksError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/ping/")
      .then((res) => {
        if (!res.ok) throw new Error(t("common.error"));
        return res.json();
      })
      .then((resp: { data: PingTask[] }) => setAllTasks(resp.data ?? []))
      .catch((err) => setTasksError(err.message || t("common.error")));
  }, [t]);

  const builtinTargetSet = React.useMemo(() => {
    const set = new Set<string>();
    for (const n of presets?.nodes_v4 ?? []) set.add(n.target);
    return set;
  }, [presets]);

  const nodeByKey = React.useMemo(() => {
    const map = new Map<string, { province_code: string; carrier_code: string; target: string }>();
    for (const n of presets?.nodes_v4 ?? []) {
      map.set(nodeKey(n.province_code, n.carrier_code), n);
    }
    return map;
  }, [presets]);

  const customTasks = React.useMemo(
    () => (allTasks ?? []).filter((task) => !task.target || !builtinTargetSet.has(task.target)),
    [allTasks, builtinTargetSet]
  );

  const initialBuiltinChecked = React.useMemo(() => {
    const set = new Set<string>();
    for (const task of allTasks ?? []) {
      if (!task.target || !builtinTargetSet.has(task.target)) continue;
      if (!task.clients?.includes(nodeUuid)) continue;
      const match = (presets?.nodes_v4 ?? []).find((n) => n.target === task.target);
      if (match) set.add(nodeKey(match.province_code, match.carrier_code));
    }
    return set;
  }, [allTasks, builtinTargetSet, presets, nodeUuid]);

  const initialInterval = React.useMemo(() => {
    const existing = (allTasks ?? []).find(
      (task) => task.target && builtinTargetSet.has(task.target) && task.clients?.includes(nodeUuid)
    );
    return existing?.interval ?? 60;
  }, [allTasks, builtinTargetSet, nodeUuid]);

  const [builtinChecked, setBuiltinChecked] = React.useState<Set<string>>(new Set());
  const [customChecked, setCustomChecked] = React.useState<Set<number>>(new Set());
  const [interval, setInterval] = React.useState(60);
  const [initialized, setInitialized] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (initialized || !allTasks || !presets) return;
    setBuiltinChecked(new Set(initialBuiltinChecked));
    setCustomChecked(
      new Set(
        (allTasks ?? [])
          .filter((task) => task.id !== undefined)
          .filter((task) => !task.target || !builtinTargetSet.has(task.target))
          .filter((task) => task.clients?.includes(nodeUuid))
          .map((task) => task.id as number)
      )
    );
    setInterval(initialInterval);
    setInitialized(true);
  }, [initialized, allTasks, presets, initialBuiltinChecked, initialInterval, builtinTargetSet, nodeUuid]);

  const toggleBuiltin = (key: string) => {
    setBuiltinChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCustom = (id: number) => {
    setCustomChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectCarrier = (carrierCode: string) => {
    setBuiltinChecked((prev) => {
      const next = new Set(prev);
      for (const p of presets?.provinces ?? []) next.add(nodeKey(p.code, carrierCode));
      return next;
    });
  };

  const clearAll = () => setBuiltinChecked(new Set());

  const handleSubmit = () => {
    const builtin = Array.from(builtinChecked)
      .map((key) => nodeByKey.get(key))
      .filter((n): n is { province_code: string; carrier_code: string; target: string } => !!n)
      .map((n) => ({ province_code: n.province_code, carrier_code: n.carrier_code }));

    setSaving(true);
    fetch("/api/admin/ping/sync-client-nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: nodeUuid,
        interval,
        builtin,
        custom_task_ids: Array.from(customChecked),
      }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data?.message || t("common.error"));
          });
        }
        return res.json();
      })
      .then(() => {
        toast.success(t("common.updated_successfully"));
        onDone();
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setSaving(false));
  };

  if (presetsError || tasksError) {
    return <div className="text-red-500 mt-3">{presetsError || tasksError}</div>;
  }
  if (presetsLoading || !allTasks) {
    return <div className="mt-3">{t("loading")}</div>;
  }

  return (
    <Flex direction="column" gap="4" className="mt-3">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">
            {t("pingNodes.builtinSection", "内置节点")}
            <span className="ml-2 text-xs text-gray-500 font-normal">
              {t("pingNodes.builtinSectionSub", "全国 31 省 · 电信/联通/移动")}
            </span>
          </div>
          <Flex align="center" gap="2">
            <span className="text-xs text-gray-500">{t("ping.interval")}</span>
            <TextField.Root
              type="number"
              min="1"
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value) || 60)}
              style={{ width: 72 }}
            />
          </Flex>
        </div>
        <Flex gap="2" wrap="wrap" className="mb-2">
          <Button size="1" variant="soft" onClick={clearAll}>
            {t("common.deselect_all")}
          </Button>
          {(presets?.carriers ?? []).map((c) => (
            <Button key={c.code} size="1" variant="outline" onClick={() => selectCarrier(c.code)}>
              {t("ping.builtin_only_carrier", "只选{{carrier}}", { carrier: c.name })}
            </Button>
          ))}
        </Flex>
        <div
          className="grid grid-cols-2 gap-x-6 gap-y-1 overflow-y-auto pr-1"
          style={{ maxHeight: 320 }}
        >
          {(presets?.provinces ?? []).map((p) => (
            <div key={p.code} className="flex items-center gap-3 py-1 text-sm">
              <span className="w-14 shrink-0 text-gray-500">{p.name}</span>
              <Flex gap="3">
                {(presets?.carriers ?? []).map((c) => {
                  const key = nodeKey(p.code, c.code);
                  return (
                    <label key={c.code} className="flex items-center gap-1 cursor-pointer">
                      <Checkbox
                        checked={builtinChecked.has(key)}
                        onCheckedChange={() => toggleBuiltin(key)}
                      />
                      <span>{c.name}</span>
                    </label>
                  );
                })}
              </Flex>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold mb-2">{t("pingNodes.customSection", "自建节点")}</div>
        {customTasks.length === 0 ? (
          <div className="text-sm text-gray-500">{t("common.none")}</div>
        ) : (
          <div className="flex flex-col gap-1 overflow-y-auto pr-1" style={{ maxHeight: 180 }}>
            {customTasks
              .filter((task) => task.id !== undefined)
              .map((task) => (
                <label key={task.id} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                  <Checkbox
                    checked={customChecked.has(task.id as number)}
                    onCheckedChange={() => toggleCustom(task.id as number)}
                  />
                  <span className="font-medium">{task.name}</span>
                  <span className="text-xs text-gray-500">
                    {task.type}/{task.target}/{task.interval}s
                  </span>
                </label>
              ))}
          </div>
        )}
      </div>

      <Flex gap="2" justify="end">
        <Dialog.Close>
          <Button variant="soft" color="gray" type="button">
            {t("common.cancel")}
          </Button>
        </Dialog.Close>
        <Button disabled={saving} onClick={handleSubmit}>
          {t("common.save")}
        </Button>
      </Flex>
    </Flex>
  );
};
