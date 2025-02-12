import { QuarterIdentifier } from "../types/quarter-identifier.type";

export interface Quarter {
  id: number;
  identifier: QuarterIdentifier;
  fromMonth: number;
  toMonth: number;
  monthRange: string;
}
