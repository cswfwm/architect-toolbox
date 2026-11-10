import { ToolboxAccessory } from './ToolboxAccessory.js';

export class ArchitectSuite extends ToolboxAccessory {
    get SlotId() { return 'ArchitectSuite'; }

    SetDefaults() {
        super.SetDefaults();
        this.Item.rare = 5;
        this.Tooltip = '随身携带全部肉前工作台：熔炉、铁砧、锯木机、织布机、炼药台等\n自动制作用它判定工作台，不再需要跑到工作台旁';
    }

    AddRecipes() {
        this.CreateRecipe()
            .AddIngredient(ModContent.ItemType('ArchitectTool'))
            .AddIngredient(Terraria.ID.ItemID.IronAnvil)
            .AddIngredient(Terraria.ID.ItemID.Furnace)
            .AddIngredient(Terraria.ID.ItemID.Sawmill)
            .AddIngredient(Terraria.ID.ItemID.Loom)
            .AddIngredient(Terraria.ID.ItemID.WorkBench)
            .AddIngredient(Terraria.ID.ItemID.Bottle)
            .AddIngredient(Terraria.ID.ItemID.Keg)
            .AddTile(Terraria.ID.TileID.WorkBenches)
            .Register();
    }
}
