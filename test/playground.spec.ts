import "reflect-metadata";

const propertyDecorator = (target: any, key: string) => {
  const designType = Reflect.getMetadata("design:type", target, key);
  console.log(`${target.name}.${key}`, designType);
};

class Test {
  @propertyDecorator
  optional?: boolean;

  @propertyDecorator
  required: string;

  @propertyDecorator
  default = 1;
}

const x = new Test();
