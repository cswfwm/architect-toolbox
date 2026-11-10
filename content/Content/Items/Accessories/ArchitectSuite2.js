import { ToolboxAccessory } from './ToolboxAccessory.js';

export class ArchitectSuite2 extends ToolboxAccessory {
    get SlotId() { return 'ArchitectSuite2'; }

    SetDefaults() {
        super.SetDefaults();
        this.Item.rare = 8;
        this.Tooltip = '随身携带全部肉后工作台：秘银砧、精金熔炉、书架、水晶球、自动锻造机等\n包含制造套装里所有肉前工作台';
    }

    AddRecipes() {
        this.CreateRecipe()
            .AddIngredient(ModContent.ItemType('ArchitectSuite'))
            .AddIngredient(Terraria.ID.ItemID.MythrilAnvil)
            .AddIngredient(Terraria.ID.ItemID.AdamantiteForge)
            .AddIngredient(Terraria.ID.ItemID.Bookcase)
            .AddIngredient(Terraria.ID.ItemID.CrystalBall)
            .AddIngredient(Terraria.ID.ItemID.Autohammer)
            .AddIngredient(Terraria.ID.ItemID.Solidifier)
            .AddTile(Terraria.ID.TileID.MythrilAnvil)
            .Register();
    }
}
