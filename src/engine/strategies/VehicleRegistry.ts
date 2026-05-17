import { VehicleStrategy } from './VehicleStrategy';
import { VanStrategy } from './vehicles/VanStrategy';
import { JeepStrategy } from './vehicles/JeepStrategy';
import { PickupStrategy } from './vehicles/PickupStrategy';
import { CustomVehicleStrategy } from './vehicles/CustomVehicleStrategy';

// Export singleton so main.ts can call .updateGrid() at runtime
export const customVehicleStrategy = new CustomVehicleStrategy();

const registry: Record<string, VehicleStrategy> = {
  van: new VanStrategy(),
  jeep: new JeepStrategy(),
  pickup: new PickupStrategy(),
  custom: customVehicleStrategy,
};

export function getVehicleStrategy(id: string): VehicleStrategy {
  return registry[id] || registry['van'];
}
