class APIError extends Error {
  statusCode: Number;
  constructor(message: string, statusCode: number= 500) {
    super(message);
    this.statusCode = statusCode;
      this.name = "API Error"; 
  }
}

export default APIError;
