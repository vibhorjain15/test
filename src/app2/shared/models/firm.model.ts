import { CustomField } from "./customField.model";

export class Firm {
    id: number;
    name: string;
    owner_user_id: number;
    owner_name: string;
    relationship_status_id?: any;
    alternate_name?: any;
    relationship_status_name?: any;
    lastTouchPoint?: any;
    last_updated_at?: any;
    tags: any[];
    key?: any;
    firm_type_id: number;
    subscription: number;
    website: string;
    firmDescription?: any;
    expiryDate?: any;
    custom_fields: CustomField[];
    tags_string?: any;
    firm_type: string;
    display_name: string;
    notification_contacts: any[];
    
    constructor() {
        
    }
}