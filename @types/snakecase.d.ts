declare module "snakecase" {
  interface SnakeCaseOptions {
    preserveConsecutiveUppercase?: boolean;
    lazyUppercase?: boolean;
    uppercase?: boolean;
    locale?: string;
  }
  export function snakecase(input = "", options?: SnakeCaseOptions): string;
  export default snakecase;
}
