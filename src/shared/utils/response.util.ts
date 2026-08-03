export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export const successResponse = <T>(data: T, message = 'Operación exitosa'): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
  };
};

export const errorResponse = (message = 'Error en el servidor', errors: any[] = []): ApiResponse => {
  return {
    success: false,
    message,
    errors,
  };
};
