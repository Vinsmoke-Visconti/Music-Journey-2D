import { VehicleStrategy } from './VehicleStrategy';
import { VanStrategy } from './vehicles/VanStrategy';
import { JeepStrategy } from './vehicles/JeepStrategy';
import { PickupStrategy } from './vehicles/PickupStrategy';

const registry: Record<string, VehicleStrategy> = {
  van: new VanStrategy(),
  jeep: new JeepStrategy(),
  pickup: new PickupStrategy(),
};

export function getVehicleStrategy(id: string): VehicleStrategy {
  return registry[id] || registry['van'];
}
