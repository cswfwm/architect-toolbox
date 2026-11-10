import { BlueprintRecorder } from '../../Common/Players/BlueprintRecorder.js';
import { ToolboxData } from '../../Common/Players/ToolboxData.js';

// /architect：把光标周围一块区域收录成蓝图，或清空蓝图。
// 用法：/architect capture [宽 高]   /architect clear   /architect build
export class ArchitectCommand extends ModCommand {
    get Command() { return 'architect'; }
    get Type() { return CommandType.Chat; }
    get Description() { return '收录蓝图：/architect capture [宽 高]、clear、build'; }

    Action(caller, input, args) {
        const player = caller.Player;
        const data = player.GetModPlayer(ToolboxData);
        const action = (args[0] ?? 'capture').toLowerCase();

        if (action === 'clear') {
            data.ClearBlueprint();
            caller.Reply('蓝图已清空');
            return;
        }
        if (action === 'build') {
            const cx = Math.floor(Terraria.Main.MouseWorld.X / 16) + 1;
            const cy = Math.floor(Terraria.Main.MouseWorld.Y / 16) + 1;
            const placed = data.Build(cx, cy, true);
            caller.Reply(`已放置 ${placed} 格`);
            return;
        }
        if (action === 'capture') {
            const w = Number(args[1] ?? 10) || 10;
            const h = Number(args[2] ?? 10) || 10;
            const cx = Math.floor(Terraria.Main.MouseWorld.X / 16) - Math.floor(w / 2);
            const cy = Math.floor(Terraria.Main.MouseWorld.Y / 16) - Math.floor(h / 2);
            BlueprintRecorder.CaptureArea(player, cx, cy, w, h);
            return;
        }
        caller.Reply('用法：/architect capture [宽 高] | clear | build');
    }
}
