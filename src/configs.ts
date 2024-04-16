import * as vscode from 'vscode';

export class Configs {
    private static enabledCursor: boolean = false;
    private static enabledExtension: boolean = false;
    private static enabledGrayscale: boolean = false;

    public static get isCursorEnabled(): boolean { return this.enabledCursor; }
    public static get isExtensionEnabled(): boolean { return this.enabledExtension; }
    public static get isGrayscaleEnabled(): boolean { return this.enabledGrayscale; }

    private constructor() { }

    public static activate(context: vscode.ExtensionContext) {
        const extName = 'funnycode';
        const configs = new Map<string, (v: boolean) => void>([
            ['enabled', (v: boolean) => Configs.enabledExtension = v],
            ['cursor', (v: boolean) => Configs.enabledCursor = v],
            ['grayscale', (v: boolean) => Configs.enabledGrayscale = v],
        ]);

        function isConfigEnabled(config: string): boolean {
            const cfg = vscode.workspace.getConfiguration(extName);
            const inspect = cfg.inspect(config);
            return !!(inspect?.globalValue ?? inspect?.defaultValue ?? false);
        }

        function toggleExtensionEnabled() {
            const configName = 'enabled';
            const value = isConfigEnabled(configName);
            const config = vscode.workspace.getConfiguration(extName);
            config.update(configName, !value, vscode.ConfigurationTarget.Global);
        }

        function onConfigChanged(event: vscode.ConfigurationChangeEvent) {
            for (const [name, setter] of configs) {
                if (event.affectsConfiguration(`${extName}.${name}`)) {
                    setter(isConfigEnabled(name));
                }
            }
        }

        for (const [name, setter] of configs) {
            setter(isConfigEnabled(name));
        }

        const toggleCommandId = 'funnycode.toggleEnable';
        const toogleCommand = vscode.commands.registerCommand(toggleCommandId, toggleExtensionEnabled);
        context.subscriptions.push(toogleCommand);

        const configSub = vscode.workspace.onDidChangeConfiguration(onConfigChanged);
        context.subscriptions.push(configSub);
    }
}