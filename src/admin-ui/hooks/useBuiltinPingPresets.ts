import React from "react";

// 内置的"全国31省市三网延迟检测"节点目录，数据来自服务端
// public:getBuiltinPingPresets（权威数据在服务端维护，见
// server/internal/platform/pingpresets）。这里只负责取数据，
// 具体展示/编辑在服务器列表的"设置监测节点"弹窗里。

export interface BuiltinProvince {
  code: string;
  name: string;
}

export interface BuiltinCarrier {
  code: string;
  name: string;
}

export interface BuiltinNode {
  province_code: string;
  province_name: string;
  carrier_code: string;
  carrier_name: string;
  ip_version: number;
  name: string;
  target: string;
}

export interface BuiltinPingPresets {
  provinces: BuiltinProvince[];
  carriers: BuiltinCarrier[];
  nodes_v4: BuiltinNode[];
  nodes_v6: BuiltinNode[];
  credit: string;
  credit_url: string;
}

let cached: BuiltinPingPresets | null = null;
let inflight: Promise<BuiltinPingPresets> | null = null;

function fetchPresets(): Promise<BuiltinPingPresets> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = fetch("/api/task/ping/builtin-presets")
      .then((res) => {
        if (!res.ok) throw new Error("failed to load builtin ping presets");
        return res.json();
      })
      .then((resp: { data: BuiltinPingPresets }) => {
        cached = resp.data;
        return resp.data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useBuiltinPingPresets() {
  const [presets, setPresets] = React.useState<BuiltinPingPresets | null>(cached);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (presets) return;
    fetchPresets()
      .then(setPresets)
      .catch((err) => setError(err.message || "error"));
  }, [presets]);

  return { presets, loading: !presets && !error, error };
}

// 只要内置节点的 target 集合，用于从"用户自建任务"列表里过滤掉内置节点。
export function useBuiltinPingTargets(): Set<string> {
  const { presets } = useBuiltinPingPresets();
  return React.useMemo(() => {
    const set = new Set<string>();
    for (const n of presets?.nodes_v4 ?? []) set.add(n.target);
    for (const n of presets?.nodes_v6 ?? []) set.add(n.target);
    return set;
  }, [presets]);
}
