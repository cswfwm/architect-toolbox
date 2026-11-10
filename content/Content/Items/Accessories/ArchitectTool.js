import { ToolboxAccessory } from './ToolboxAccessory.js';

export class ArchitectTool extends ToolboxAccessory {
    get SlotId() { return 'ArchitectTool'; }

    SetDefaults() {
        super.SetDefaults();
        this.Item.rare = 4;
        this.Tooltip = '装备后开启建筑师模式：视野内自由放置、网格与测距、蓝图构建\n放进建筑师工具栏可长期生效';
    }

    AddRecipes() {
        this.CreateRecipe()
            .AddIngredient(Terraria.ID.ItemID.Wood, 20)
            .AddIngredient(Terraria.ID.ItemID.Gel, 5)
            .AddTile(Terraria.ID.TileID.WorkBenches)
            .Register();
    }
}
