import React, { useState } from 'react';
import { useInventory } from '../../lib/stores/useInventory';
import { useCharacter } from '../../lib/stores/useCharacter';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Package, Sword, Shield, Heart, Coins } from 'lucide-react';
import type { Item, ItemType } from '../../types/game';

/**
 * A component that displays the player's inventory.
 * @returns {JSX.Element} The rendered inventory panel.
 */
export const InventoryPanel: React.FC = () => {
  const { items, consumeItem, getTotalValue } = useInventory();
  const { character, updateCharacter, gameEngine } = useCharacter();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleUseItem = (itemId: string) => {
    if (!character) return;

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const result = consumeItem(itemId);
    
    if (result.success && item.type === 'consumable') {
      // Apply consumable effects to character
      const gameResult = gameEngine.useItem(character, item);
      if (gameResult.success) {
        updateCharacter(gameResult.character);
      }
    }

    console.log(result.message);
  };

  const getItemsByType = (type: ItemType) => {
    return items.filter(item => item.type === type);
  };

  const getItemIcon = (item: Item) => {
    switch (item.type) {
      case 'weapon':
        return <Sword className="h-4 w-4" />;
      case 'armor':
        return <Shield className="h-4 w-4" />;
      case 'consumable':
        return <Heart className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getRarityColor = (rarity: Item['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'bg-muted text-muted-foreground';
      case 'uncommon':
        return 'bg-success text-foreground';
      case 'rare':
        return 'bg-primary text-primary-foreground';
      case 'epic':
        return 'bg-accent text-accent-foreground';
      case 'legendary':
        return 'bg-warning text-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const ItemCard: React.FC<{ item: Item }> = ({ item }) => (
    <Card 
      className="bg-muted border-border hover:bg-muted transition-colors cursor-pointer"
      onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getItemIcon(item)}
            <div>
              <h4 className="font-semibold text-foreground text-sm">{item.name}</h4>
              <Badge variant="secondary" className={`text-xs ${getRarityColor(item.rarity)}`}>
                {item.rarity}
              </Badge>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 text-warning">
              <Coins className="h-3 w-3" />
              <span className="text-xs">{item.value}</span>
            </div>
            {item.quantity && item.quantity > 1 && (
              <span className="text-xs text-muted-foreground">×{item.quantity}</span>
            )}
          </div>
        </div>

        {selectedItem?.id === item.id && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">{item.description}</p>
            
            {/* Item Stats */}
            {(item.damage || item.armor || item.healing || item.stats) && (
              <div className="space-y-1 mb-3">
                {item.damage && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Damage:</span>
                    <span className="text-destructive">{item.damage}</span>
                  </div>
                )}
                {item.armor && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Armor:</span>
                    <span className="text-primary">{item.armor}</span>
                  </div>
                )}
                {item.healing && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Healing:</span>
                    <span className="text-success">{item.healing}</span>
                  </div>
                )}
                {item.stats && Object.entries(item.stats).map(([stat, value]) => (
                  <div key={stat} className="flex justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{stat}:</span>
                    <span className="text-primary">+{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {item.type === 'consumable' && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseItem(item.id);
                  }}
                  className="bg-success hover:bg-success/90 text-xs"
                >
                  Use
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(null);
                }}
                className="text-xs border-border hover:bg-muted"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Inventory Summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Package className="h-5 w-5" />
            Inventory Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{items.length}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{getTotalValue()}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{getItemsByType('weapon').length}</div>
              <div className="text-sm text-muted-foreground">Weapons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{getItemsByType('consumable').length}</div>
              <div className="text-sm text-muted-foreground">Consumables</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-card border-border">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="weapon">Weapons</TabsTrigger>
          <TabsTrigger value="armor">Armor</TabsTrigger>
          <TabsTrigger value="consumable">Consumables</TabsTrigger>
          <TabsTrigger value="misc">Misc</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, index) => (
              <ItemCard key={`${item.id}-${index}`} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weapon" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getItemsByType('weapon').map((item, index) => (
              <ItemCard key={`${item.id}-${index}`} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="armor" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getItemsByType('armor').map((item, index) => (
              <ItemCard key={`${item.id}-${index}`} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consumable" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getItemsByType('consumable').map((item, index) => (
              <ItemCard key={`${item.id}-${index}`} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="misc" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getItemsByType('misc').concat(getItemsByType('quest')).map((item, index) => (
              <ItemCard key={`${item.id}-${index}`} item={item} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {items.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Empty Inventory</h3>
            <p className="text-sm text-muted-foreground">
              Your inventory is empty. Explore the world to find items and equipment!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
