import { ZodError } from "zod";

export const errorHandler = (err: unknown) => {
    let error = err as { message: string; status: number };

    if (err instanceof ZodError) {
        error = {
            message: err.issues.map((e) => e.message).join(", "),
            status: 400,
        };
    }

    return Response.json(
        {
            message: error.message,
        },
        {
            status: error.status,
        },
    );
};
