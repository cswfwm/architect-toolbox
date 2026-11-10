import { ToolboxAccessory } from './ToolboxAccessory.js';
import { Item, Tile, Present } from '../../../Common/Ids.js';

const PARTS = ['MythrilAnvil', 'AdamantiteForge', 'Bookcase', 'CrystalBall', 'Autohammer', 'Solidifier'];

export class ArchitectSuite2 extends ToolboxAccessory {
    get SlotId() { return 'ArchitectSuite2'; }

    SetDefaults() {
        super.SetDefaults();
        this.Item.rare = 8;
        this.Tooltip = '随身携带全部肉后工作台：秘银砧、精金熔炉、书架、水晶球、自动锻造机等\n包含制造套装里所有肉前工作台';
    }

    AddRecipes() {
        const recipe = this.CreateRecipe().AddIngredient(ModContent.ItemType('ArchitectSuite'));
        for (const name of PARTS) {
            const type = Item(name);
            if (Present(type)) recipe.AddIngredient(type);
        }
        const anvil = Tile('MythrilAnvil');
        if (Present(anvil)) recipe.AddTile(anvil);
        recipe.Register();
    }
}
