import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/** A small persisted document. Everything the tool remembers lives in a few of these under data/. */
export interface Store<T> {
  read(): T;
  write(value: T): void;
}

export class MemoryStore<T> implements Store<T> {
  private value: T;
  constructor(initial: T) {
    this.value = structuredClone(initial);
  }
  read(): T {
    return structuredClone(this.value);
  }
  write(value: T): void {
    this.value = structuredClone(value);
  }
}

export class JsonFileStore<T> implements Store<T> {
  private readonly path: string;
  private readonly initial: T;
  constructor(path: string, initial: T) {
    this.path = path;
    this.initial = initial;
  }
  read(): T {
    try {
      return JSON.parse(readFileSync(this.path, 'utf8')) as T;
    } catch {
      return structuredClone(this.initial);
    }
  }
  write(value: T): void {
    mkdirSync(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp`;
    writeFileSync(tmp, JSON.stringify(value, null, 1));
    renameSync(tmp, this.path); // atomic replace: a crash never leaves half a file
  }
}
