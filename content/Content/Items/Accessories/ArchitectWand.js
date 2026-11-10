import { ToolboxAccessory } from './ToolboxAccessory.js';

export class ArchitectWand extends ToolboxAccessory {
    get SlotId() { return 'ArchitectWand'; }

    SetDefaults() {
        super.SetDefaults();
        this.Item.rare = 4;
        this.Tooltip = '手持时点住方块即可把它收进蓝图\n一次点选同时收录光标那一格，配合 /architect capture 可整块收录';
    }

    AddRecipes() {
        this.CreateRecipe()
            .AddIngredient(ModContent.ItemType('ArchitectTool'))
            .AddIngredient(Terraria.ID.ItemID.Wood, 10)
            .AddIngredient(Terraria.ID.ItemID.Amethyst)
            .AddTile(Terraria.ID.TileID.WorkBenches)
            .Register();
    }
}
