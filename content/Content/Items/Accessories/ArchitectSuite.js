import { ToolboxAccessory } from './ToolboxAccessory.js';
import { Item, Tile, Present } from '../../../Common/Ids.js';

const PARTS = ['IronAnvil', 'Furnace', 'Sawmill', 'Loom', 'WorkBench', 'Bottle', 'Keg'];

export class ArchitectSuite extends ToolboxAccessory {
    get SlotId() { return 'ArchitectSuite'; }

    SetDefaults() {
        super.SetDefaults();
        this.Item.rare = 5;
        this.Tooltip = '随身携带全部肉前工作台：熔炉、铁砧、锯木机、织布机、炼药台等\n自动制作用它判定工作台，不再需要跑到工作台旁';
    }

    AddRecipes() {
        const recipe = this.CreateRecipe().AddIngredient(ModContent.ItemType('ArchitectTool'));
        for (const name of PARTS) {
            const type = Item(name);
            if (Present(type)) recipe.AddIngredient(type);
        }
        const bench = Tile('WorkBenches');
        if (Present(bench)) recipe.AddTile(bench);
        recipe.Register();
    }
}
