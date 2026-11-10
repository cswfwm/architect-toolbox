import { ToolboxConfig } from '../Configs/ToolboxConfig.js';
import { ToolboxData } from '../Players/ToolboxData.js';

const Main = Terraria.Main;
const { TextureAssets } = Terraria.GameContent;
const FillRect = Microsoft.Xna.Framework.Graphics.SpriteBatch['void Draw(Texture2D texture, Rectangle destinationRectangle, Color color)'];
const DrawIcon = Microsoft.Xna.Framework.Graphics.SpriteBatch['void Draw(Texture2D texture, Vector2 position, Nullable`1 sourceRectangle, Color color, float rotation, Vector2 origin, float scale, SpriteEffects effects, float layerDepth)'];
const DrawBorderString = Terraria.Utils['void DrawBorderString(SpriteBatch sb, string text, Vector2 position, Color color, float scale)'];
const Hit = (mx, my, rect) => mx >= rect.X && mx <= rect.X + rect.W && my >= rect.Y && my <= rect.Y + rect.H;

function LocalData() {
    return Main.player[Main.myPlayer].GetModPlayer(ToolboxData);
}

function Chat(text) {
    Main.NewText(text, '#8FD3FF');
}

function TakeOne(player, type) {
    for (const item of player.inventory) {
        if (item == null || item.type !== type || item.stack <= 0) continue;
        item.stack -= 1;
        if (item.stack <= 0) item['void TurnToAir(bool wideNet)'](false);
        return true;
    }
    return false;
}

function GiveBack(player, type) {
    player['void QuickSpawnItem(IEntitySource source, int item, int stack)'](player.GetItemSource_Misc(0), type, 1);
}

// 六个独立槽位，不占原版饰品栏。点一下把背包里的同件饰品装进去，再点取出。
export class ToolbarPanel extends UIElement {
    constructor() {
        super();
        this.Width.Set(44, 0);
        this.Height.Set(238, 0);
        this.Left.Set(8, 0);
        this.Top.Set(116, 0);
        this.pressedIndex = -1;
    }

    SlotRect(index) {
        const base = this.GetDimensions();
        return { X: base.X + 5, Y: base.Y + 5 + index * 38, W: 34, H: 34 };
    }

    ToggleSlot(index) {
        const data = LocalData();
        const slot = data.Slots[index];
        const player = Main.player[Main.myPlayer];
        const itemType = ModContent.ItemType(slot.Kind);

        if (slot.Filled) {
            GiveBack(player, itemType);
            slot.Filled = false;
            SoundEngine.PlaySound(Terraria.ID.SoundID.MenuClose, player.Center);
            return;
        }
        if (TakeOne(player, itemType)) {
            slot.Filled = true;
            SoundEngine.PlaySound(Terraria.ID.SoundID.Grab, player.Center);
        } else {
            Chat(`背包里没有：${slot.def.name}`);
        }
    }

    Update(gameTime) {
        super.Update(gameTime);
        const data = LocalData();
        const visible = data.ArchitectEnabled;
        this.IgnoresMouseInteraction = !visible;
        if (!visible) return;

        if (this.ContainsPoint(Main.MouseScreen)) Main.player[Main.myPlayer].mouseInterface = true;
        // 手机没有悬停：按下和抬起落在同一格才算一次点击。
        if (!Main.mouseLeft) return;
        if (this.pressedIndex >= 0) return;
        for (let index = 0; index < 6; index++) {
            if (Hit(Main.mouseX, Main.mouseY, this.SlotRect(index))) {
                this.pressedIndex = index;
                return;
            }
        }
    }

    LeftClick(evt) {
        const index = this.pressedIndex;
        this.pressedIndex = -1;
        if (index < 0) return;
        if (!Hit(evt.MousePosition.X, evt.MousePosition.Y, this.SlotRect(index))) return;
        this.ToggleSlot(index);
    }

    DrawSelf(spriteBatch) {
        const data = LocalData();
        if (!data.ArchitectEnabled) return;

        DrawBorderString(spriteBatch, '建筑师工具栏', Vector2.new(this.GetDimensions().X + 3, this.GetDimensions().Y - 18),
            Color.new(150, 210, 255), 0.62);

        for (let index = 0; index < 6; index++) {
            const slot = data.Slots[index];
            const rect = this.SlotRect(index);
            const hover = Hit(Main.mouseX, Main.mouseY, rect);
            FillRect(spriteBatch, new Rectangle(rect.X - 1, rect.Y - 1, rect.W + 2, rect.H + 2),
                hover ? Color.new(150, 200, 255) : Color.new(96, 126, 176));
            FillRect(spriteBatch, new Rectangle(rect.X, rect.Y, rect.W, rect.H),
                slot.Filled ? Color.new(64, 108, 176) : Color.new(38, 38, 48));

            const itemType = ModContent.ItemType(slot.Kind);
            Main.instance.LoadItem(itemType);
            const texture = TextureAssets.Item[itemType].Value;
            if (texture != null) {
                const scale = Math.min(1, 26 / Math.max(texture.Width, texture.Height));
                DrawIcon(spriteBatch, texture, Vector2.new(rect.X + 17, rect.Y + 17), null,
                    slot.Filled ? Color.White : Color.new(110, 110, 120, 150), 0,
                    Vector2.new(texture.Width / 2, texture.Height / 2), scale, 0, 0);
            }
            if (hover) {
                DrawBorderString(spriteBatch, slot.def.name, Vector2.new(rect.X + 40, rect.Y + 8),
                    Color.new(255, 228, 150), 0.7);
            }
        }
    }
}

// 材料清单 + 立即构建 / 自动制作 / 清空。
export class BlueprintPanel extends UIPanel {
    constructor() {
        super();
        this.SetPadding(0);
        this.Width.Set(216, 0);
        this.Height.Set(150, 0);
        this.Left.Set(56, 0);
        this.Top.Set(116, 0);
        this.BackgroundColor = Color.new(24, 40, 70);
        this.pressedButton = null;
    }

    Buttons() {
        const base = this.GetDimensions();
        return [
            { id: 'build', label: '立即构建', rect: { X: base.X + 8, Y: base.Y + 118, W: 64, H: 24 } },
            { id: 'craft', label: '自动制作', rect: { X: base.X + 76, Y: base.Y + 118, W: 64, H: 24 } },
            { id: 'clear', label: '清空蓝图', rect: { X: base.X + 144, Y: base.Y + 118, W: 66, H: 24 } },
        ];
    }

    Update(gameTime) {
        super.Update(gameTime);
        const data = LocalData();
        const visible = data.ArchitectEnabled;
        this.IgnoresMouseInteraction = !visible;
        if (!visible) return;

        const inside = this.ContainsPoint(Main.MouseScreen);
        if (inside) Main.player[Main.myPlayer].mouseInterface = true;
        if (!Main.mouseLeft) return;
        if (this.pressedButton != null) return;
        for (const button of this.Buttons()) {
            if (Hit(Main.mouseX, Main.mouseY, button.rect)) {
                this.pressedButton = button.id;
                return;
            }
        }
    }

    LeftClick(evt) {
        const id = this.pressedButton;
        this.pressedButton = null;
        if (id == null) return;

        const data = LocalData();
        if (id === 'build') {
            const x = Math.floor(Main.MouseWorld.X / 16) + 1;
            const y = Math.floor(Main.MouseWorld.Y / 16) + 1;
            const instant = ModContent.GetInstance(ToolboxConfig).InstantBlueprint;
            if (data.Build(x, y, instant) > 0) {
                SoundEngine.PlaySound(Terraria.ID.SoundID.Item37, Main.player[Main.myPlayer].Center);
            }
        } else if (id === 'craft') {
            data.AutoCraftForBlueprint();
        } else {
            data.ClearBlueprint();
            Chat('蓝图已清空');
        }
    }

    DrawSelf(spriteBatch) {
        const data = LocalData();
        if (!data.ArchitectEnabled) return;
        const base = this.GetDimensions();
        const config = ModContent.GetInstance(ToolboxConfig);

        DrawBorderString(spriteBatch, `蓝图 ${data.Blueprint.size} 格`, Vector2.new(base.X + 8, base.Y + 6),
            Color.new(180, 220, 255), 0.78);
        if (config.ShowMaterials) {
            DrawBorderString(spriteBatch, data.MaterialsSummary(), Vector2.new(base.X + 8, base.Y + 26),
                Color.new(220, 230, 240), 0.62);
            data.Materials().slice(0, 4).forEach((entry, index) => {
                const text = `${Terraria.Lang.GetItemNameValue(entry.itemType)} ${entry.have}/${entry.need}`;
                const color = entry.missing > 0 ? Color.new(255, 140, 120) : Color.new(150, 230, 160);
                DrawBorderString(spriteBatch, text, Vector2.new(base.X + 8, base.Y + 46 + index * 16), color, 0.66);
            });
        }

        for (const button of this.Buttons()) {
            const hover = Hit(Main.mouseX, Main.mouseY, button.rect);
            FillRect(spriteBatch, new Rectangle(button.rect.X, button.rect.Y, button.rect.W, button.rect.H),
                hover ? Color.new(96, 146, 214) : Color.new(52, 78, 126));
            DrawBorderString(spriteBatch, button.label, Vector2.new(button.rect.X + 5, button.rect.Y + 4), Color.White, 0.66);
        }
    }
}

// 装备工程师眼镜后出现的独立格：放一把远程武器。
export class GlassesPanel extends UIElement {
    constructor() {
        super();
        this.Width.Set(40, 0);
        this.Height.Set(40, 0);
        this.Left.Set(8, 0);
        this.Top.Set(364, 0);
        this.pressed = false;
    }

    SlotRect() {
        const base = this.GetDimensions();
        return { X: base.X + 3, Y: base.Y + 3, W: 34, H: 34 };
    }

    Update(gameTime) {
        super.Update(gameTime);
        const data = LocalData();
        const visible = data.ArchitectEnabled && data.GlassesEnabled;
        this.IgnoresMouseInteraction = !visible;
        if (!visible) return;
        if (this.ContainsPoint(Main.MouseScreen)) Main.player[Main.myPlayer].mouseInterface = true;
        if (Main.mouseLeft && Hit(Main.mouseX, Main.mouseY, this.SlotRect())) this.pressed = true;
    }

    LeftClick(evt) {
        const pressed = this.pressed;
        this.pressed = false;
        if (!pressed || !Hit(evt.MousePosition.X, evt.MousePosition.Y, this.SlotRect())) return;

        const data = LocalData();
        const player = Main.player[Main.myPlayer];
        if (data.GlassesWeaponType > 0) {
            GiveBack(player, data.GlassesWeaponType);
            data.GlassesWeaponType = 0;
            return;
        }
        for (const item of player.inventory) {
            if (item == null || item.type <= 0 || item.stack <= 0) continue;
            if (!item.ranged || item.useAmmo <= 0) continue;
            data.GlassesWeaponType = item.type;
            item.stack -= 1;
            if (item.stack <= 0) item['void TurnToAir(bool wideNet)'](false);
            SoundEngine.PlaySound(Terraria.ID.SoundID.Grab, player.Center);
            return;
        }
        Chat('背包里没有远程武器');
    }

    DrawSelf(spriteBatch) {
        const data = LocalData();
        if (!data.ArchitectEnabled || !data.GlassesEnabled) return;
        const rect = this.SlotRect();
        const hover = Hit(Main.mouseX, Main.mouseY, rect);

        DrawBorderString(spriteBatch, '武器', Vector2.new(rect.X, rect.Y - 16), Color.new(150, 210, 255), 0.6);
        FillRect(spriteBatch, new Rectangle(rect.X - 1, rect.Y - 1, rect.W + 2, rect.H + 2),
            hover ? Color.new(150, 200, 255) : Color.new(96, 126, 176));
        FillRect(spriteBatch, new Rectangle(rect.X, rect.Y, rect.W, rect.H), Color.new(44, 44, 54));

        if (data.GlassesWeaponType > 0) {
            Main.instance.LoadItem(data.GlassesWeaponType);
            const texture = TextureAssets.Item[data.GlassesWeaponType].Value;
            if (texture != null) {
                const scale = Math.min(1, 26 / Math.max(texture.Width, texture.Height));
                DrawIcon(spriteBatch, texture, Vector2.new(rect.X + 17, rect.Y + 17), null, Color.White, 0,
                    Vector2.new(texture.Width / 2, texture.Height / 2), scale, 0, 0);
            }
        }
    }
}

export class ToolbarState extends UIState {
    OnInitialize() {
        this.Append(new ToolbarPanel());
        this.Append(new BlueprintPanel());
        this.Append(new GlassesPanel());
    }
}
