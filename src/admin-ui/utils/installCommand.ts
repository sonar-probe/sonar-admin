import {
  quotePowerShellArg,
  quoteShellArg,
  quoteShellArgs,
} from "@/admin-ui/utils/shellQuote";

export type InstallPlatform = "linux" | "windows" | "macos" | "docker";

export interface AgentInstallOptions {
  ignoreUnsafeCert: boolean;
  memoryIncludeCache: boolean;
  getIpAddrFromNic: boolean;
  enableGpu: boolean;
  ghproxy: string;
  dir: string;
  serviceName: string;
  includeNics: string;
  excludeNics: string;
  includeMountpoints: string;
  interval: string;
  monthRotate: string;
  installVersion: string;
}

export const emptyAgentInstallOptions = (): AgentInstallOptions => ({
  ignoreUnsafeCert: false,
  memoryIncludeCache: false,
  getIpAddrFromNic: false,
  enableGpu: false,
  ghproxy: "",
  dir: "",
  serviceName: "",
  includeNics: "",
  excludeNics: "",
  includeMountpoints: "",
  interval: "",
  monthRotate: "",
  installVersion: "",
});

export interface AgentInstallToggles {
  enableGhproxy: boolean;
  enableCustomDir: boolean;
  enableCustomServiceName: boolean;
  enableIncludeNics: boolean;
  enableExcludeNics: boolean;
  enableIncludeMountpoints: boolean;
  enableInterval: boolean;
  enableMonthRotate: boolean;
  enableInstallVersion: boolean;
}

/** Resolves the base URL agents should report back to, from the configured script domain (or the current origin). */
export function resolveScriptHost(scriptDomain: string | undefined): string {
  if (!scriptDomain) {
    return window.location.origin;
  }
  if (scriptDomain.startsWith("http")) {
    return scriptDomain.replace(/\/+$/, "");
  }
  return `http://${scriptDomain.replace(/\/+$/, "")}`;
}

/** Builds the agent CLI flag args (everything after the identity args like -e/-t/--auto-discovery). */
export function buildInstallFlagArgs(
  options: AgentInstallOptions,
  toggles: AgentInstallToggles,
): string[] {
  const args: string[] = [];
  if (options.ignoreUnsafeCert) args.push("--ignore-unsafe-cert");
  if (options.memoryIncludeCache) args.push("--memory-include-cache");
  if (options.getIpAddrFromNic) args.push("--get-ip-addr-from-nic");
  if (options.enableGpu) args.push("--gpu");

  const ghproxy = options.ghproxy.trim();
  if (toggles.enableGhproxy && ghproxy) {
    const finalUrl = (ghproxy.startsWith("http") ? ghproxy : `http://${ghproxy}`).replace(/\/+$/, "");
    args.push("--install-ghproxy", finalUrl);
  }
  const installDir = options.dir.trim();
  if (toggles.enableCustomDir && installDir) {
    args.push("--install-dir", installDir);
  }
  const serviceName = options.serviceName.trim();
  if (toggles.enableCustomServiceName && serviceName) {
    args.push("--install-service-name", serviceName);
  }
  const installVersion = options.installVersion.trim();
  if (toggles.enableInstallVersion && installVersion) {
    args.push("--install-version", installVersion);
  }
  const includeNics = options.includeNics.trim();
  if (toggles.enableIncludeNics && includeNics) {
    args.push("--include-nics", includeNics);
  }
  const excludeNics = options.excludeNics.trim();
  if (toggles.enableExcludeNics && excludeNics) {
    args.push("--exclude-nics", excludeNics);
  }
  const includeMountpoints = options.includeMountpoints.trim();
  if (toggles.enableIncludeMountpoints && includeMountpoints) {
    args.push("--include-mountpoint", includeMountpoints);
  }
  if (toggles.enableInterval) {
    const intervalVal = Number.parseFloat((options.interval || "").trim());
    args.push("-i", Number.isFinite(intervalVal) && intervalVal >= 1 ? String(intervalVal) : "1");
  }
  if (toggles.enableMonthRotate) {
    const rotateVal = (options.monthRotate || "").trim() || "1";
    args.push("--month-rotate", rotateVal);
  }
  return args;
}

/** Builds the (possibly ghproxy-mirrored) install-script URL for a given platform. */
export function buildInstallScriptUrl(
  platform: InstallPlatform,
  ghproxyEnabled: boolean,
  ghproxy: string,
): string {
  const scriptFile = platform === "windows" ? "install.ps1" : "install.sh";
  let scriptUrl = `https://raw.githubusercontent.com/sonar-probe/sonar-agent/refs/heads/main/${scriptFile}`;
  const trimmedGhproxy = ghproxy.trim();
  if (ghproxyEnabled && trimmedGhproxy) {
    scriptUrl = scriptUrl.slice(8); // 去掉 https://
    scriptUrl = trimmedGhproxy.endsWith("/") ? `${trimmedGhproxy}${scriptUrl}` : `${trimmedGhproxy}/${scriptUrl}`;
    if (!scriptUrl.startsWith("http")) {
      scriptUrl = `http://${scriptUrl}`;
    }
  }
  return scriptUrl;
}

const INSTALL_ONLY_FLAGS = [
  "--install-ghproxy",
  "--install-dir",
  "--install-service-name",
  "--install-version",
];

/** Strips install-script-only flags (and their values) for the Docker run form. */
function stripInstallOnlyFlags(args: string[]): string[] {
  const dockerArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (INSTALL_ONLY_FLAGS.includes(args[i])) {
      i++; // 跳过该标志的取值
      continue;
    }
    dockerArgs.push(args[i]);
  }
  return dockerArgs;
}

/**
 * Builds the full install command for a platform, given the identity args
 * (e.g. ["-e", host, "-t", token] or ["-e", host, "--auto-discovery", key])
 * and the flag args from buildInstallFlagArgs.
 *
 * `persistAutoDiscoveryFile` bind-mounts auto-discovery.json into the Docker
 * container so a re-registered uuid/token survives container recreation —
 * only relevant when the identity args use --auto-discovery, since a fixed
 * -t token doesn't need that persistence.
 */
export function buildInstallCommand(
  platform: InstallPlatform,
  identityArgs: string[],
  flagArgs: string[],
  options: { ghproxyEnabled: boolean; ghproxy: string; persistAutoDiscoveryFile?: boolean },
): string {
  const args = [...identityArgs, ...flagArgs];
  const scriptUrl = buildInstallScriptUrl(platform, options.ghproxyEnabled, options.ghproxy);

  switch (platform) {
    case "linux":
      return `wget -qO- ${quoteShellArg(scriptUrl)} | sudo bash -s -- ` + quoteShellArgs(args);
    case "windows": {
      let command =
        `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ` +
        `"iwr ${quotePowerShellArg(scriptUrl)}` +
        ` -UseBasicParsing -OutFile 'install.ps1'; &` +
        ` '.\\install.ps1'`;
      args.forEach((arg) => {
        command += ` ${quotePowerShellArg(arg)}`;
      });
      command += `"`;
      return command;
    }
    case "macos":
      return `zsh <(curl -sL ${quoteShellArg(scriptUrl)}) ` + quoteShellArgs(args);
    case "docker": {
      const dockerArgs = stripInstallOnlyFlags(args);
      if (options.persistAutoDiscoveryFile) {
        // 自动发现会在 /app/auto-discovery.json 写入注册得到的 uuid/token，
        // 通过 bind mount 持久化该文件，容器更新重建后复用同一身份，避免重复注册。
        // 注意：文件挂载要求宿主机上文件已存在，否则 Docker 会将其创建为目录。
        return (
          `touch .sonar-auto-discovery.json && ` +
          `docker run -d --name sonar-agent --restart=always ` +
          `-v .sonar-auto-discovery.json:/app/auto-discovery.json ` +
          `ghcr.io/sonar-probe/sonar-agent:latest ` +
          quoteShellArgs(dockerArgs)
        );
      }
      return (
        `docker run -d --name sonar-agent --restart=always ` +
        `ghcr.io/sonar-probe/sonar-agent:latest ` +
        quoteShellArgs(dockerArgs)
      );
    }
  }
}
