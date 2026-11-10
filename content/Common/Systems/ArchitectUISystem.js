import { ToolbarState } from '../UI/ToolbarPanel.js';
import { ScannerState } from '../UI/ScannerOrb.js';
import { DrawWorldOverlay } from '../UI/WorldOverlay.js';

const Main = Terraria.Main;

// 一个系统负责两层：世界层（屏幕像素）和界面层（UI 单位）。
export class ArchitectUISystem extends ModSystem {
    hud = null;
    scanner = null;

    PostSetupContent() {
        this.hud = new ToolbarState();
        this.hud.Activate();
        this.scanner = new ScannerState();
        this.scanner.Activate();
    }

    UpdateUI(gameTime) {
        this.hud?.Update(gameTime);
        this.scanner?.Update(gameTime);
    }

    ModifyInterfaceLayers(layers) {
        const mouseText = layers.FindIndex((layer) => layer.Name === 'Vanilla: Mouse Text');
        if (mouseText !== -1) {
            layers.Insert(mouseText, new LegacyGameInterfaceLayer('ArchitectToolbox: World Overlay', () => {
                if (!Main.gameMenu) DrawWorldOverlay(Main.spriteBatch);
                return true;
            }, InterfaceScaleType.Game));
        }

        const inventory = layers.FindIndex((layer) => layer.Name === 'Vanilla: Inventory');
        const at = inventory === -1 ? (mouseText === -1 ? 0 : mouseText) : inventory;
        layers.Insert(at, new LegacyGameInterfaceLayer('ArchitectToolbox: Toolbar', () => {
            if (Main.gameMenu) return true;
            this.hud.Draw(Main.spriteBatch, null);
            this.scanner.Draw(Main.spriteBatch, null);
            return true;
        }, InterfaceScaleType.UI));
    }
}
