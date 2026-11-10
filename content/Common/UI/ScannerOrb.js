import { ToolboxData } from '../Players/ToolboxData.js';
import { ToolboxConfig } from '../Configs/ToolboxConfig.js';
import { ScanChests, ChestContents } from '../Players/EngineerPlayer.js';
import { ItemNamesZh } from '../Data/ItemNames.js';
import { PinyinIndex } from '../Data/PinyinIndex.js';

const Main = Terraria.Main;
const ItemID = Terraria.ID.ItemID;
const { TextureAssets } = Terraria.GameContent;
const FillRect = Microsoft.Xna.Framework.Graphics.SpriteBatch['void Draw(Texture2D texture, Rectangle destinationRectangle, Color color)'];
const DrawBorderString = Terraria.Utils['void DrawBorderString(SpriteBatch sb, string text, Vector2 position, Color color, float scale)'];
const Hit = (mx, my, rect) => mx >= rect.X && mx <= rect.X + rect.W && my >= rect.Y && my <= rect.Y + rect.H;

const KEY_ROWS = ['ABCDEFGH', 'IJKLMNOP', 'QRSTUVWX', 'YZ'];
const PANEL_W = 240;
const PANEL_H = 214;

function LocalData() {
    return Main.player[Main.myPlayer].GetModPlayer(ToolboxData);
}

// 中文名 -> 拼音索引，只建一次。
const ZhByName = new Map();
for (const key of Object.keys(ItemNamesZh)) {
    const extra = PinyinIndex[key];
    if (extra != null) ZhByName.set(extra.zh, extra);
}

function Matches(entry, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    if (entry.zh.includes(query)) return true;
    if (entry.abbr.includes(q)) return true;
    if (entry.py.includes(q)) return true;
    return false;
}

let CachedIndex = null;

function BuildIndex() {
    const entries = [];
    for (let type = 1; type < ItemID.Count; type++) {
        const name = Terraria.Lang.GetItemNameValue(type);
        if (!name) continue;
        const extra = ZhByName.get(name) ?? null;
        entries.push({
            Type: type,
            zh: extra != null ? extra.zh : name,
            py: extra != null ? extra.py : '',
            abbr: extra != null ? extra.abbr : '',
        });
    }
    return entries;
}

export function SearchItems(query, limit) {
    if (CachedIndex == null) CachedIndex = BuildIndex();
    const hits = [];
    for (const entry of CachedIndex) {
        if (!Matches(entry, query)) continue;
        hits.push(entry);
        if (hits.length >= limit) break;
    }
    return hits;
}

// 悬浮球：可以拖，点开是检索面板。
export class ScannerOrb extends UIElement {
    constructor() {
        super();
        this.Width.Set(34, 0);
        this.Height.Set(34, 0);
        this.query = '';
        this.results = [];
        this.chests = [];
        this.orbPressed = false;
        this.dragging = false;
        this.pressedKey = null;
        this.pressedResult = null;
    }

    OrbRect(data) {
        return { X: data.OrbX, Y: data.OrbY, W: 34, H: 34 };
    }

    PanelRect(data) {
        const orb = this.OrbRect(data);
        let x = orb.X + 38;
        let y = orb.Y;
        if (x + PANEL_W > Main.screenWidth) x = orb.X - PANEL_W - 6;
        if (y + PANEL_H > Main.screenHeight) y = Main.screenHeight - PANEL_H - 6;
        return { X: x, Y: y, W: PANEL_W, H: PANEL_H };
    }

    KeyRect(panel, row, index) {
        return { X: panel.X + 8 + index * 28, Y: panel.Y + 28 + row * 24, W: 25, H: 21 };
    }

    ResultRect(panel, index) {
        return { X: panel.X + 8, Y: panel.Y + 144 + index * 16, W: 220, H: 15 };
    }

    Update(gameTime) {
        super.Update(gameTime);
        const data = LocalData();
        const visible = data.ArchitectEnabled && data.ScannerEnabled;
        this.IgnoresMouseInteraction = !visible;
        if (!visible) return;

        const orb = this.OrbRect(data);
        const insideOrb = Hit(Main.mouseX, Main.mouseY, orb);

        // 拖动：按住球移动。
        if (this.dragging && Main.mouseLeft) {
            data.OrbX = Math.max(4, Math.min(Main.screenWidth - 40, Main.mouseX - 17));
            data.OrbY = Math.max(4, Math.min(Main.screenHeight - 40, Main.mouseY - 17));
            return;
        }
        if (!Main.mouseLeft) {
            this.dragging = false;
            // 抬手：处理球、字母键和候选词。
            this.FinishPress(data, insideOrb);
            return;
        }

        if (insideOrb) {
            Main.player[Main.myPlayer].mouseInterface = true;
            if (!this.orbPressed) {
                this.orbPressed = true;
                this.dragStart = { X: Main.mouseX, Y: Main.mouseY };
            } else if (Math.abs(Main.mouseX - this.dragStart.X) + Math.abs(Main.mouseY - this.dragStart.Y) > 6) {
                this.dragging = true;
            }
            return;
        }

        if (!data.OrbOpen) return;
        const panel = this.PanelRect(data);
        if (Hit(Main.mouseX, Main.mouseY, panel)) Main.player[Main.myPlayer].mouseInterface = true;

        KEY_ROWS.forEach((row, rowIndex) => {
            for (let i = 0; i < row.length; i++) {
                if (Hit(Main.mouseX, Main.mouseY, this.KeyRect(panel, rowIndex, i))) this.pressedKey = row[i];
            }
        });
        for (let i = 0; i < 4; i++) {
            if (Hit(Main.mouseX, Main.mouseY, this.ResultRect(panel, i))) this.pressedResult = i;
        }
    }

    FinishPress(data, insideOrb) {
        if (this.orbPressed) {
            this.orbPressed = false;
            if (!this.dragging && insideOrb) {
                data.OrbOpen = !data.OrbOpen;
                if (data.OrbOpen) {
                    this.query = '';
                    this.refresh(data);
                }
            }
            this.dragging = false;
            return;
        }

        if (this.pressedKey != null) {
            this.query = this.pressedKey.toLowerCase();
            this.pressedKey = null;
            this.refresh(data);
            return;
        }

        if (this.pressedResult != null) {
            const entry = this.results[this.pressedResult];
            this.pressedResult = null;
            if (entry != null) {
                // 选中候选词后只显示这一种，方便直接看数量。
                this.query = entry.abbr || entry.zh;
                this.refresh(data);
            }
        }
    }

    refresh(data) {
        this.results = SearchItems(this.query, 8);
        this.chests = ScanChests(Main.player[Main.myPlayer], ModContent.GetInstance(ToolboxConfig).SearchRange);
    }

    DrawSelf(spriteBatch) {
        const data = LocalData();
        if (!data.ArchitectEnabled || !data.ScannerEnabled) return;

        const orb = this.OrbRect(data);
        FillRect(spriteBatch, new Rectangle(orb.X, orb.Y, orb.W, orb.H), Color.new(30, 90, 140, 220));
        FillRect(spriteBatch, new Rectangle(orb.X + 3, orb.Y + 3, orb.W - 6, orb.H - 6), Color.new(90, 200, 240, 235));
        DrawBorderString(spriteBatch, '搜', Vector2.new(orb.X + 10, orb.Y + 6), Color.new(10, 30, 50), 0.75);
        if (!data.OrbOpen) return;

        const panel = this.PanelRect(data);
        FillRect(spriteBatch, new Rectangle(panel.X, panel.Y, panel.W, panel.H), Color.new(18, 32, 56, 240));
        FillRect(spriteBatch, new Rectangle(panel.X, panel.Y, panel.W, 2), Color.new(110, 190, 240));
        DrawBorderString(spriteBatch, `容器检索（半径 ${ModContent.GetInstance(ToolboxConfig).SearchRange} 格）`,
            Vector2.new(panel.X + 8, panel.Y + 8), Color.new(190, 225, 255), 0.66);

        // 手机上没有键盘，用字母键选首字母，再点候选词缩小范围。
        KEY_ROWS.forEach((row, rowIndex) => {
            for (let i = 0; i < row.length; i++) {
                const rect = this.KeyRect(panel, rowIndex, i);
                const hover = Hit(Main.mouseX, Main.mouseY, rect);
                FillRect(spriteBatch, new Rectangle(rect.X, rect.Y, rect.W, rect.H),
                    hover ? Color.new(120, 180, 230) : Color.new(48, 74, 118));
                DrawBorderString(spriteBatch, row[i], Vector2.new(rect.X + 6, rect.Y + 3), Color.White, 0.62);
            }
        });

        DrawBorderString(spriteBatch, `检索：${this.query || '（全部）'}`, Vector2.new(panel.X + 8, panel.Y + 128),
            Color.new(170, 200, 230), 0.62);

        this.results.slice(0, 4).forEach((entry, index) => {
            const rect = this.ResultRect(panel, index);
            if (Hit(Main.mouseX, Main.mouseY, rect)) {
                FillRect(spriteBatch, new Rectangle(rect.X, rect.Y, rect.W, rect.H), Color.new(60, 92, 140));
            }
            const total = this.CountNearby(entry.Type);
            DrawBorderString(spriteBatch, `${entry.zh}  x${total}`, Vector2.new(rect.X + 2, rect.Y),
                total > 0 ? Color.new(200, 255, 210) : Color.new(150, 160, 175), 0.6);
        });
    }

    CountNearby(type) {
        let total = 0;
        for (const chest of this.chests) {
            for (const item of ChestContents(chest.Index)) {
                if (item.Type === type) total += item.Stack;
            }
        }
        return total;
    }
}

export class ScannerState extends UIState {
    OnInitialize() {
        this.Append(new ScannerOrb());
    }
}
