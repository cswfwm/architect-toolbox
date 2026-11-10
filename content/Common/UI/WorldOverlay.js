import { ToolboxData } from '../Players/ToolboxData.js';
import { ToolboxConfig } from '../Configs/ToolboxConfig.js';

const Main = Terraria.Main;
const { TextureAssets } = Terraria.GameContent;
const FillRect = Microsoft.Xna.Framework.Graphics.SpriteBatch['void Draw(Texture2D texture, Rectangle destinationRectangle, Color color)'];
const DrawBorderString = Terraria.Utils['void DrawBorderString(SpriteBatch sb, string text, Vector2 position, Color color, float scale)'];

// 世界层绘制：网格、测距标尺、蓝图预览、锁定准星。
// 用 InterfaceScaleType.Game 的层，坐标都是屏幕像素。
export function DrawWorldOverlay(spriteBatch) {
    const data = Main.player[Main.myPlayer].GetModPlayer(ToolboxData);
    if (!data.ArchitectEnabled) return;

    const config = ModContent.GetInstance(ToolboxConfig);
    const pixel = TextureAssets.MagicPixel.Value;
    const left = Main.screenPosition.X;
    const top = Main.screenPosition.Y;
    const right = left + Main.screenWidth;
    const bottom = top + Main.screenHeight;

    if (config.GridAlways) {
        // 每 16 像素一格，每 5 格加重，方便数格子。
        const startX = Math.floor(left / 16) * 16;
        for (let x = startX; x < right; x += 16) {
            const screenX = Math.floor(x - left);
            const major = Math.floor(x / 16) % 5 === 0;
            FillRect(spriteBatch, new Rectangle(screenX, 0, 1, Main.screenHeight),
                major ? Color.new(120, 190, 255, 90) : Color.new(120, 190, 255, 32));
        }
        const startY = Math.floor(top / 16) * 16;
        for (let y = startY; y < bottom; y += 16) {
            const screenY = Math.floor(y - top);
            const major = Math.floor(y / 16) % 5 === 0;
            FillRect(spriteBatch, new Rectangle(0, screenY, Main.screenWidth, 1),
                major ? Color.new(120, 190, 255, 90) : Color.new(120, 190, 255, 32));
        }
    }

    const cursorX = Math.floor(Main.MouseWorld.X / 16);
    const cursorY = Math.floor(Main.MouseWorld.Y / 16);
    const playerX = Math.floor(Main.player[Main.myPlayer].Center.X / 16);
    const playerY = Math.floor(Main.player[Main.myPlayer].Center.Y / 16);

    // 测距：光标到玩家的横向、纵向格数与直线距离。
    if (config.Ruler) {
        const dx = cursorX - playerX;
        const dy = cursorY - playerY;
        const lines = [`X ${Math.abs(dx)}   Y ${Math.abs(dy)}`, `直线 ${Math.round(Math.sqrt(dx * dx + dy * dy))} 格`];
        lines.forEach((text, index) => {
            DrawBorderString(spriteBatch, text, Vector2.new(8, Main.screenHeight - 60 + index * 18),
                Color.new(180, 230, 255), 0.72);
        });
    }

    // 蓝图预览：把蓝图左上角放在光标处，逐格画出可放置/缺材料的颜色。
    if (data.Blueprint.size > 0) {
        for (const [key, cell] of data.Blueprint) {
            const [dx, dy] = key.split(',').map(Number);
            const screenX = Math.floor((cursorX + dx) * 16 - left);
            const screenY = Math.floor((cursorY + dy) * 16 - top);
            if (screenX < -16 || screenY < -16 || screenX > Main.screenWidth || screenY > Main.screenHeight) continue;
            const placeable = data.CanPlacePreview(cell.type);
            FillRect(spriteBatch, new Rectangle(screenX, screenY, 16, 16),
                placeable ? Color.new(90, 220, 140, 80) : Color.new(240, 110, 90, 80));
            FillRect(spriteBatch, new Rectangle(screenX, screenY, 16, 1), Color.new(200, 255, 220, 120));
            FillRect(spriteBatch, new Rectangle(screenX, screenY, 1, 16), Color.new(200, 255, 220, 120));
        }
    }

    // 自动锁定准星。
    if (config.Reticle && data.GlassesEnabled && data.HasAimTarget) {
        const screenX = Math.floor(data.AimTargetX - left);
        const screenY = Math.floor(data.AimTargetY - top);
        const arm = 9;
        for (let i = -arm; i <= arm; i += 2) {
            FillRect(spriteBatch, new Rectangle(screenX + i, screenY - arm, 1, arm * 2), Color.new(255, 70, 70, 220));
            FillRect(spriteBatch, new Rectangle(screenX - arm, screenY + i, arm * 2, 1), Color.new(255, 70, 70, 220));
        }
        FillRect(spriteBatch, new Rectangle(screenX - 1, screenY - 1, 3, 3), Color.new(255, 220, 220));
    }
}
