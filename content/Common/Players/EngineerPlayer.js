import { ToolboxConfig } from '../Configs/ToolboxConfig.js';
import { ToolboxData } from './ToolboxData.js';

const Main = Terraria.Main;

export function FindNearestTarget(player, maxRange) {
    let best = null;
    let bestDistance = maxRange * 16;
    for (const npc of Main.npc) {
        if (npc == null || !npc.active || npc.friendly) continue;
        if (npc.lifeMax <= 0) continue;
        if (!npc['bool CanBeChasedBy(Nullable`1 chasingPlayer, bool ignoreDontTakeDamage)'](null, false)) continue;
        const dx = npc.Center.X - player.Center.X;
        const dy = npc.Center.Y - player.Center.Y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= bestDistance) continue;
        bestDistance = distance;
        best = npc;
    }
    return best;
}

export function PickAmmo(player, weapon) {
    const wanted = weapon.useAmmo;
    if (wanted <= 0) return null;
    const preferInventory = ModContent.GetInstance(ToolboxConfig).AmmoPriority === '背包优先';
    let fallback = null;
    for (let i = 0; i < player.inventory.length; i++) {
        const ammo = player.inventory[i];
        if (ammo == null || ammo.type <= 0 || ammo.stack <= 0) continue;
        if (ammo.ammo !== wanted) continue;
        // 前 50 格是背包，后 9 格是弹药栏（弹药栏优先时反过来挑）。
        const inInventorySlot = i < 50;
        if (preferInventory === inInventorySlot) return ammo;
        if (fallback == null) fallback = ammo;
    }
    return fallback;
}

// 自动瞄准：锁定最近敌人，冷却好了就直接打一枪。
export class EngineerPlayer extends ModPlayer {
    PostUpdateEquips(player) {
        const data = player.GetModPlayer(ToolboxData);
        if (!data.GlassesEnabled) return;
        if (!player.active || player.dead) return;

        const config = ModContent.GetInstance(ToolboxConfig);
        const target = FindNearestTarget(player, config.AimRange);
        data.HasAimTarget = target != null;
        if (target == null) return;
        data.AimTargetX = target.Center.X;
        data.AimTargetY = target.Center.Y;

        const weaponType = data.GlassesWeaponType;
        if (weaponType <= 0) return;

        const weapon = new Terraria.Item();
        weapon.SetDefaults(weaponType);
        if (weapon.damage <= 0) return;

        const ammo = PickAmmo(player, weapon);
        if (weapon.useAmmo > 0 && ammo == null) return;
        if (player.itemAnimation > 0 || player.itemTime > 0) return;

        const dx = target.Center.X - player.Center.X;
        const dy = target.Center.Y - player.Center.Y;
        const angle = Math.atan2(dy, dx);
        const speed = weapon.shootSpeed > 0 ? weapon.shootSpeed : 9;
        const velocity = Vector2.new(Math.cos(angle) * speed, Math.sin(angle) * speed);

        if (weapon.shoot <= 0) return;
        Terraria.Projectile['int NewProjectile(IEntitySource spawnSource, Vector2 position, Vector2 velocity, int Type, int Damage, float KnockBack, int Owner, float ai0, float ai1, float ai2, NewProjectileModifier modifer)'](
            player.GetProjectileSource_Item(weapon), player.Center, velocity, weapon.shoot,
            weapon.damage, weapon.knockBack, player.whoAmI, 0, 0, 0, null);

        player.itemAnimation = weapon.useAnimation;
        player.itemTime = weapon.useTime;
        player.direction = dx >= 0 ? 1 : -1;

        if (ammo != null) {
            ammo.stack -= 1;
            if (ammo.stack <= 0) ammo['void TurnToAir(bool wideNet)'](false);
        }
        SoundEngine.PlaySound(weapon.UseSound, player.Center);
    }
}

// 容器扫描：以玩家为中心、半径 radius 格内的箱子。
export function ScanChests(player, radius) {
    const results = [];
    const cx = Math.floor(player.Center.X / 16);
    const cy = Math.floor(player.Center.Y / 16);
    for (let index = 0; index < Main.chest.length; index++) {
        const chest = Main.chest[index];
        if (chest == null || chest.x < 0) continue;
        if (Math.abs(chest.x - cx) > radius || Math.abs(chest.y - cy) > radius) continue;
        results.push({ Index: index, X: chest.x, Y: chest.y });
    }
    return results;
}

export function ChestContents(index) {
    const chest = Main.chest[index];
    if (chest == null) return [];
    const items = [];
    for (let i = 0; i < chest.item.length; i++) {
        const slot = chest.item[i];
        if (slot == null || slot.type <= 0 || slot.stack <= 0) continue;
        items.push({ Type: slot.type, Stack: slot.stack });
    }
    return items;
}

