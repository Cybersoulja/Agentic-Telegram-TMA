import type {
  Character,
  CharacterClass,
  GameState,
  Item,
  CombatState,
  Enemy,
  Spell,
  StatusEffect,
} from '../types/game';
import { CHARACTER_CLASSES } from '../data/characters';
import { STARTING_ITEMS, CONSUMABLE_ITEMS } from '../data/items';
import { getAvailableSpells } from '../data/spells';

export class GameEngine {
  private saveKeyPrefix = 'rpg_game_save_slot_';
  private version = '2.0.0';

  createCharacter(name: string, characterClass: CharacterClass): Character {
    const classData = CHARACTER_CLASSES[characterClass];
    const baseHealth = this.calculateHealth(classData.baseStats.constitution);
    const baseMana = this.calculateMana(classData.baseStats.intelligence);

    // Get starting spells for the class
    const startingSpells = getAvailableSpells(characterClass, 1).map((s) => s.id);

    return {
      id: `char_${Date.now()}`,
      name,
      class: characterClass,
      level: 1,
      experience: 0,
      stats: { ...classData.baseStats },
      health: baseHealth,
      maxHealth: baseHealth,
      mana: baseMana,
      maxMana: baseMana,
      gold: classData.startingGold,
      createdAt: new Date(),
      equippedItems: {
        weapon: null,
        armor: null,
        accessory1: null,
        accessory2: null,
      },
      statusEffects: [],
      knownSpells: startingSpells,
      talents: [],
      unspentStatPoints: 0,
      playtime: 0,
    };
  }

  calculateHealth(constitution: number): number {
    return 20 + constitution * 2;
  }

  calculateMana(intelligence: number): number {
    return 10 + intelligence * 1.5;
  }

  getStartingItems(characterClass: CharacterClass): Item[] {
    const items = [...STARTING_ITEMS[characterClass]];
    // Add some basic consumables
    items.push(
      { ...CONSUMABLE_ITEMS[0], quantity: 3 }, // Health potions
      { ...CONSUMABLE_ITEMS[2], quantity: 5 } // Bread
    );
    return items;
  }

  calculateExperienceToNextLevel(level: number): number {
    return level * 100;
  }

  gainExperience(character: Character, amount: number): Character {
    const newExperience = character.experience + amount;
    const experienceNeeded = this.calculateExperienceToNextLevel(character.level);

    let newCharacter = { ...character, experience: newExperience };

    if (newExperience >= experienceNeeded) {
      newCharacter = this.levelUp(newCharacter);
    }

    return newCharacter;
  }

  levelUp(character: Character): Character {
    const newLevel = character.level + 1;
    const statIncrease = this.getStatIncreaseForClass(character.class);

    const newStats = {
      strength: character.stats.strength + statIncrease.strength,
      dexterity: character.stats.dexterity + statIncrease.dexterity,
      intelligence: character.stats.intelligence + statIncrease.intelligence,
      constitution: character.stats.constitution + statIncrease.constitution,
      wisdom: character.stats.wisdom + statIncrease.wisdom,
      charisma: character.stats.charisma + statIncrease.charisma,
    };

    const healthIncrease = Math.floor(statIncrease.constitution * 2) + 5;
    const manaIncrease = Math.floor(statIncrease.intelligence * 1.5) + 3;

    // Learn new spells at certain levels
    const newSpells = getAvailableSpells(character.class, newLevel)
      .filter((spell) => !character.knownSpells.includes(spell.id))
      .map((s) => s.id);

    // Grant stat points every 5 levels
    const statPointsGained = newLevel % 5 === 0 ? 2 : 0;

    return {
      ...character,
      level: newLevel,
      experience:
        character.experience - this.calculateExperienceToNextLevel(character.level),
      stats: newStats,
      maxHealth: character.maxHealth + healthIncrease,
      health: character.health + healthIncrease, // Heal on level up
      maxMana: character.maxMana + manaIncrease,
      mana: character.mana + manaIncrease,
      knownSpells: [...character.knownSpells, ...newSpells],
      unspentStatPoints: character.unspentStatPoints + statPointsGained,
    };
  }

  getStatIncreaseForClass(characterClass: CharacterClass) {
    const increases = {
      warrior: {
        strength: 2,
        dexterity: 1,
        intelligence: 0,
        constitution: 2,
        wisdom: 1,
        charisma: 0,
      },
      mage: {
        strength: 0,
        dexterity: 1,
        intelligence: 2,
        constitution: 1,
        wisdom: 2,
        charisma: 1,
      },
      rogue: {
        strength: 1,
        dexterity: 2,
        intelligence: 1,
        constitution: 1,
        wisdom: 1,
        charisma: 1,
      },
      cleric: {
        strength: 1,
        dexterity: 0,
        intelligence: 1,
        constitution: 1,
        wisdom: 2,
        charisma: 2,
      },
    };
    return increases[characterClass];
  }

  // Equipment System
  getEquippedWeapon(character: Character): Item | null {
    return character.equippedItems.weapon;
  }

  getEquippedArmor(character: Character): Item | null {
    return character.equippedItems.armor;
  }

  getTotalStats(character: Character): Character['stats'] {
    const baseStats = { ...character.stats };

    // Apply equipment bonuses
    Object.values(character.equippedItems).forEach((item) => {
      if (item?.stats) {
        Object.entries(item.stats).forEach(([stat, value]) => {
          if (value && stat in baseStats) {
            baseStats[stat as keyof typeof baseStats] += value as number;
          }
        });
      }
    });

    // Apply status effect bonuses
    character.statusEffects.forEach((effect) => {
      if (effect.statModifier) {
        Object.entries(effect.statModifier).forEach(([stat, value]) => {
          if (value && stat in baseStats) {
            baseStats[stat as keyof typeof baseStats] += value;
          }
        });
      }
    });

    return baseStats;
  }

  getTotalArmor(character: Character): number {
    let totalArmor = Math.floor(character.stats.constitution / 4);

    // Add armor from equipped items
    Object.values(character.equippedItems).forEach((item) => {
      if (item?.armor) {
        totalArmor += item.armor;
      }
    });

    return totalArmor;
  }

  useItem(
    character: Character,
    item: Item
  ): { character: Character; success: boolean; message: string } {
    if (item.type === 'consumable') {
      let newCharacter = { ...character };
      let message = '';

      if (item.healing && character.health < character.maxHealth) {
        const healAmount = Math.min(item.healing, character.maxHealth - character.health);
        newCharacter.health += healAmount;
        message = `Restored ${healAmount} health points.`;
      } else if (item.healing) {
        return { character, success: false, message: 'Health is already at maximum.' };
      }

      // Add mana restoration logic
      if (item.name.toLowerCase().includes('mana') && character.mana < character.maxMana) {
        const manaAmount = 20; // Default mana restoration
        const actualRestore = Math.min(manaAmount, character.maxMana - character.mana);
        newCharacter.mana += actualRestore;
        message = `Restored ${actualRestore} mana points.`;
      }

      // Apply temporary stat bonuses
      if (item.stats) {
        // Add a buff status effect
        const buff: StatusEffect = {
          id: `buff_${Date.now()}`,
          name: `${item.name} Effect`,
          type: 'buff_strength', // Simplified
          duration: 10,
          statModifier: item.stats,
          icon: '💪',
          stackable: false,
        };
        newCharacter.statusEffects = [...newCharacter.statusEffects, buff];
        message += ` Gained temporary stat boost!`;
      }

      return { character: newCharacter, success: true, message };
    }

    return { character, success: false, message: 'Item cannot be used.' };
  }

  // Combat System
  initiateCombat(enemies: Enemy[], playerLevel: number = 1): CombatState {
    // Scale enemies to player level
    const scaledEnemies = enemies.map((enemy) =>
      this.scaleEnemyToLevel(enemy, playerLevel)
    );

    return {
      isActive: true,
      enemies: scaledEnemies,
      turnOrder: ['player', ...scaledEnemies.map((e) => e.id)],
      currentTurn: 0,
      playerActions: [
        {
          id: 'attack',
          name: 'Attack',
          description: 'Perform a basic attack',
          type: 'attack',
        },
        {
          id: 'defend',
          name: 'Defend',
          description: 'Reduce incoming damage by 50%',
          type: 'defend',
        },
      ],
      isDefending: false,
      turnNumber: 1,
    };
  }

  scaleEnemyToLevel(enemy: Enemy, playerLevel: number): Enemy {
    if (playerLevel <= 1) return { ...enemy, statusEffects: [] };

    const levelDiff = playerLevel - 1;
    const scaleFactor = 1 + levelDiff * 0.2;

    return {
      ...enemy,
      health: Math.floor(enemy.maxHealth * scaleFactor),
      maxHealth: Math.floor(enemy.maxHealth * scaleFactor),
      damage: Math.floor(enemy.damage * (1 + levelDiff * 0.15)),
      armor: Math.floor(enemy.armor * (1 + levelDiff * 0.1)),
      level: playerLevel,
      statusEffects: [],
    };
  }

  calculateDamage(
    attacker: Character | Enemy,
    defender: Character | Enemy,
    isDefending: boolean = false
  ): number {
    let baseDamage = 0;

    if ('stats' in attacker) {
      // Player character - use total stats including equipment
      const totalStats = this.getTotalStats(attacker);
      baseDamage = Math.floor(totalStats.strength / 2) + 5;

      // Add weapon damage
      const weapon = this.getEquippedWeapon(attacker);
      if (weapon?.damage) {
        baseDamage += weapon.damage;
      }
    } else {
      // Enemy
      baseDamage = attacker.damage || 5;
    }

    let armor = 0;
    if ('stats' in defender) {
      // Player character - use total armor
      armor = this.getTotalArmor(defender);
    } else {
      // Enemy
      armor = defender.armor || 0;
    }

    // Apply defending bonus
    if (isDefending) {
      armor = Math.floor(armor * 1.5);
    }

    const finalDamage = Math.max(1, baseDamage - armor);
    const randomness = Math.floor(Math.random() * 3);

    return finalDamage + randomness;
  }

  // Status Effects
  applyStatusEffects(entity: Character | Enemy): Character | Enemy {
    let newEntity = { ...entity };

    entity.statusEffects.forEach((effect) => {
      // Apply damage/healing per turn
      if (effect.damagePerTurn && newEntity.health > 0) {
        newEntity.health = Math.max(0, newEntity.health - effect.damagePerTurn);
      }
      if (effect.healingPerTurn && 'maxHealth' in newEntity) {
        newEntity.health = Math.min(newEntity.maxHealth, newEntity.health + effect.healingPerTurn);
      }
    });

    // Reduce duration and remove expired effects
    newEntity.statusEffects = entity.statusEffects
      .map((effect) => ({ ...effect, duration: effect.duration - 1 }))
      .filter((effect) => effect.duration > 0);

    return newEntity;
  }

  addStatusEffect(entity: Character | Enemy, effect: StatusEffect): Character | Enemy {
    const newEntity = { ...entity };

    // Check if effect is stackable
    if (effect.stackable) {
      const existing = newEntity.statusEffects.find((e) => e.id === effect.id);
      if (existing) {
        // Increase stacks
        existing.stacks = (existing.stacks || 1) + 1;
        return newEntity;
      }
    } else {
      // Remove existing effect of same type if not stackable
      newEntity.statusEffects = newEntity.statusEffects.filter((e) => e.type !== effect.type);
    }

    newEntity.statusEffects = [...newEntity.statusEffects, effect];
    return newEntity;
  }

  // Save System with Multiple Slots
  saveGame(gameState: GameState, slot: number = 1): void {
    try {
      const saveData = {
        ...gameState,
        lastSaved: new Date().toISOString(),
        saveSlot: slot,
        version: this.version,
      };

      localStorage.setItem(this.saveKeyPrefix + slot, JSON.stringify(saveData));
    } catch (error) {
      console.error('Failed to save game:', error);
      throw new Error('Failed to save game. Please try again.');
    }
  }

  loadGame(slot: number = 1): GameState | null {
    try {
      const savedData = localStorage.getItem(this.saveKeyPrefix + slot);
      if (savedData) {
        const parsed = JSON.parse(savedData);

        // Validate and migrate if necessary
        if (parsed.version !== this.version) {
          console.warn('Save file version mismatch. Attempting migration...');
          // Could add migration logic here
        }

        return parsed;
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    }
    return null;
  }

  deleteSave(slot: number = 1): void {
    localStorage.removeItem(this.saveKeyPrefix + slot);
  }

  hasSavedGame(slot: number = 1): boolean {
    return localStorage.getItem(this.saveKeyPrefix + slot) !== null;
  }

  getAllSaves(): Array<{ slot: number; data: any } | null> {
    const saves: Array<{ slot: number; data: any } | null> = [];

    for (let i = 1; i <= 5; i++) {
      const saveData = this.loadGame(i);
      if (saveData) {
        saves.push({ slot: i, data: saveData });
      } else {
        saves.push(null);
      }
    }

    return saves;
  }

  // Spell Casting
  castSpell(
    caster: Character,
    spell: Spell,
    targets: Enemy[]
  ): {
    caster: Character;
    targets: Enemy[];
    damage: number;
    healing: number;
    message: string;
    statusEffect?: StatusEffect;
  } {
    let newCaster = { ...caster };
    let newTargets = [...targets];
    let totalDamage = 0;
    let totalHealing = 0;
    let message = '';

    // Check mana
    if (caster.mana < spell.manaCost) {
      return {
        caster,
        targets,
        damage: 0,
        healing: 0,
        message: 'Not enough mana!',
      };
    }

    // Consume mana
    newCaster.mana = Math.max(0, newCaster.mana - spell.manaCost);

    // Calculate spell effect
    if (spell.damage) {
      const totalStats = this.getTotalStats(caster);
      const spellPower = Math.floor((totalStats.intelligence + totalStats.wisdom) / 2);
      const baseDamage = spell.damage + spellPower;

      if (spell.targetType === 'area') {
        // Damage all enemies
        newTargets = targets.map((enemy) => {
          const damage = Math.floor(baseDamage * 0.8); // Reduced for AOE
          return { ...enemy, health: Math.max(0, enemy.health - damage) };
        });
        totalDamage = baseDamage * targets.length;
        message = `Cast ${spell.name} dealing ${Math.floor(baseDamage * 0.8)} damage to all enemies!`;
      } else {
        // Single target
        if (targets.length > 0) {
          const target = targets[0];
          newTargets[0] = { ...target, health: Math.max(0, target.health - baseDamage) };
          totalDamage = baseDamage;
          message = `Cast ${spell.name} dealing ${baseDamage} damage!`;
        }
      }
    }

    if (spell.healing) {
      const totalStats = this.getTotalStats(caster);
      const healPower = Math.floor(totalStats.wisdom * 1.5);
      const healAmount = spell.healing + healPower;
      const actualHeal = Math.min(healAmount, caster.maxHealth - caster.health);
      newCaster.health = Math.min(caster.maxHealth, caster.health + actualHeal);
      totalHealing = actualHeal;
      message = `Cast ${spell.name} healing for ${actualHeal}!`;
    }

    // Apply status effect
    let statusEffect: StatusEffect | undefined;
    if (spell.effect) {
      statusEffect = this.createStatusEffectFromSpell(spell);
    }

    return {
      caster: newCaster,
      targets: newTargets,
      damage: totalDamage,
      healing: totalHealing,
      message,
      statusEffect,
    };
  }

  createStatusEffectFromSpell(spell: Spell): StatusEffect {
    const effectTypes: Record<string, StatusEffect> = {
      burn: {
        id: `burn_${Date.now()}`,
        name: 'Burning',
        type: 'burn',
        duration: 3,
        damagePerTurn: 5,
        icon: '🔥',
        stackable: true,
      },
      poison: {
        id: `poison_${Date.now()}`,
        name: 'Poisoned',
        type: 'poison',
        duration: 5,
        damagePerTurn: 3,
        icon: '☠️',
        stackable: true,
      },
      freeze: {
        id: `freeze_${Date.now()}`,
        name: 'Frozen',
        type: 'freeze',
        duration: 2,
        icon: '❄️',
        stackable: false,
      },
      stun: {
        id: `stun_${Date.now()}`,
        name: 'Stunned',
        type: 'stun',
        duration: 1,
        icon: '💫',
        stackable: false,
      },
      buff_strength: {
        id: `buff_str_${Date.now()}`,
        name: 'Strength Boost',
        type: 'buff_strength',
        duration: 3,
        statModifier: { strength: 5 },
        icon: '💪',
        stackable: false,
      },
      buff_defense: {
        id: `buff_def_${Date.now()}`,
        name: 'Defense Boost',
        type: 'buff_defense',
        duration: 3,
        statModifier: { constitution: 5 },
        icon: '🛡️',
        stackable: false,
      },
      regeneration: {
        id: `regen_${Date.now()}`,
        name: 'Regeneration',
        type: 'regeneration',
        duration: 5,
        healingPerTurn: 5,
        icon: '💚',
        stackable: false,
      },
    };

    return effectTypes[spell.effect!] || effectTypes.burn;
  }
}
