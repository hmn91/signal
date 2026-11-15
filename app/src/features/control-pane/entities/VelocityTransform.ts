export class VelocityTransform {
  constructor(
    private readonly height: number,
    readonly min = 0,
    readonly max = 127,
  ) {}

  get maxHeight(): number {
    return this.height
  }

  getHeight(velocity: number): number {
    return Math.max(
      0,
      ((velocity - this.min) / (this.max - this.min)) * this.height,
    )
  }

  getY(velocity: number): number {
    return this.height - this.getHeight(velocity)
  }

  getVelocity(y: number): number {
    return Math.max(
      1,
      Math.min(
        127,
        Math.round(
          this.min +
            Math.max(0, Math.min(1, 1 - y / this.height)) *
              (this.max - this.min),
        ),
      ),
    )
  }
}
