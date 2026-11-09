import { z } from "zod";

const requirementsSchema = z.object({
  facilities: z.array(z.string()).optional(),

  budget: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
    })
    .refine((value) => value.min <= value.max, {
      message: "Minimum budget cannot exceed maximum budget",
    })
    .optional(),

  genderPreferences: z.enum(["MALE", "FEMALE", "ANY"]).optional(),

  notes: z.string().max(1000).default(""),
});

const targetSchema = z.object({
  propertyName: z.string().trim().min(1),
  address: z.string().trim().min(1),
  googleMapsUrls: z.string().url().optional().or(z.literal("")),
  ownerContact: z.string().optional(),
});

export const createOrderSchema = z
  .object({
    serviceType: z.enum(["SURVEYOR_RECOMENDATION", "USER_CHOICE"]),

    surveyLocation: z.object({
      province: z.string().trim().min(1),
      city: z.string().trim().min(1),
      district: z.string().trim().min(1),
    }),

    kosCount: z.number().int().min(1),

    requirements: requirementsSchema.optional(),

    targets: z.array(targetSchema).default([]),

    surveyDate: z.iso.date(),
    moveInDate: z.iso.date(),
  })
  .superRefine((data, ctx) => {
    if (data.serviceType === "USER_CHOICE" && data.targets.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one target property is required",
        path: ["targets"],
      });
    }

    if (data.serviceType === "SURVEYOR_RECOMENDATION") {
      if (!data.requirements?.budget) {
        ctx.addIssue({
          code: "custom",
          message: "Budget is required",
          path: ["requirements", "budget"],
        });
      }

      if (!data.requirements?.genderPreferences) {
        ctx.addIssue({
          code: "custom",
          message: "Gender preference is required",
          path: ["requirements", "genderPreferences"],
        });
      }
    }
  });

export type CreateOrderInput = z.input<typeof createOrderSchema>;
export type ValidatedOrderInput = z.output<typeof createOrderSchema>;
