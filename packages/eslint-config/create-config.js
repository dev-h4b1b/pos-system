import antfu from "@antfu/eslint-config";
export default function createConfig(options = {}, ...userConfigs) {
  return antfu({ type: "app", typescript: true, formatters: true, ...options }, ...userConfigs);
}
