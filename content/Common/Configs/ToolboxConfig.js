export class ToolboxConfig extends ModConfig {
    static Options = {
        InstantBlueprint: ModConfig.Toggle(true),
        AutoCraft: ModConfig.Toggle(true),
        ShowMaterials: ModConfig.Toggle(true),
        Reticle: ModConfig.Toggle(true),
        GridAlways: ModConfig.Toggle(true),
        Ruler: ModConfig.Toggle(true),
        AmmoPriority: ModConfig.Radio('背包优先', ['背包优先', '弹药栏优先']),
        AimRange: ModConfig.Range(40, { min: 10, max: 80, step: 5, suffix: ' 格' }),
        SearchRange: ModConfig.Range(10, { min: 4, max: 20, step: 1, suffix: ' 格' }),
    };
}
