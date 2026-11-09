import { ZodError } from "zod";

export const errorHandler = (err: unknown) => {
    let message = "Internal server error";
    let status = 500;

    if (err instanceof ZodError) {
        message = err.issues.map((e) => e.message).join(", ");
        status = 400;
    } else if (err instanceof Error) {
        message = err.message;

        const customError = err as Error & { status?: number };
        status = customError.status ?? 500;
    } else if (typeof err === "object" && err !== null) {
        const customError = err as {
            message?: string;
            status?: number;
        };

        message = customError.message ?? message;
        status = customError.status ?? status;
    }

    return Response.json(
        { message },
        { status }
    );
};
