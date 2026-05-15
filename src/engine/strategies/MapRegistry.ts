import { MapStrategy } from './MapStrategy';
import { BeachMap } from './maps/BeachMap';
import { DesertMap } from './maps/DesertMap';
import { SnowMap } from './maps/SnowMap';
import { JungleMap } from './maps/JungleMap';

const registry: Record<string, MapStrategy> = {
  beach: new BeachMap(),
  desert: new DesertMap(),
  snow: new SnowMap(),
  jungle: new JungleMap(),
};

export function getMapStrategy(id: string): MapStrategy {
  return registry[id] || registry['beach'];
}
