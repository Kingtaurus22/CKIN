// ORDERS

export type AssignmentStatus =
    | "OPEN"
    | "ASSIGNED"
    | "COMPLETED"
    | "CANCELLED";

export type OrderStatus =
    | "PENDING_PAYMENT"
    | "PAID"
    | "FAILED"
    | "CANCELLED";

export type PaymentStatus =
    | "UNPAID"
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "EXPIRED";

export interface OrderPayment {
    provider: "MIDTRANS";
    midtransOrderId: string;
    snapToken?: string;
    redirectUrl?: string;
    transactionId?: string;
    paymentType?: string;
    paymentStatus: PaymentStatus;
}

export interface OrderRequirements {
    facilities: string[];
    budget: {
        min: number;
        max: number;
    };
    genderPreferences: "MALE" | "FEMALE" | "ANY";
    notes?: string;
}

export interface OrderTarget {
    propertyName: string;
    address: string;
    googleMapsUrls?: string;
    ownerContact?: string;
}

export interface OrderType {
    UserId: string;
    SurveyorId?: string | null;

    serviceType: string;

    surveyLocation: {
        province: string;
        city: string;
        district: string;
    };

    kosCount: number;

    requirements: OrderRequirements;

    targets: OrderTarget[];

    surveyDate: Date;

    assignmentStatus: AssignmentStatus;
    status: OrderStatus;
    payment?: OrderPayment;

    pricing: number;

    paidAt?: Date | null;

    createdAt: Date;
    updatedAt: Date;
}

export interface OrderTypeSurveyor {
    _id: string
    UserId: string;
    SurveyorId?: string | null;

    serviceType: string;

    surveyLocation: {
        province: string;
        city: string;
        district: string;
    };

    kosCount: number;

    requirements: OrderRequirements;

    targets: OrderTarget[];

    surveyDate: Date;

    assignmentStatus: AssignmentStatus;
    status: OrderStatus;
    payment?: OrderPayment;

    pricing: number;

    paidAt?: Date | null;

    createdAt: Date;
    updatedAt: Date;

    customerName: string;
}

// SURVEYORS
export interface SurveyorType {
    _id: string;
    UserId: string;
    domicileProvince: string;
    domicileCity: string;
    domicileDistrict: string;
    coverageAreas: {
        province: string;
        city: string;
        districts: string[];
    };
    Income: number;
    fullname: string;
}