// See https://svelte.dev/docs/kit/types#app.d.ts
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};

// MongoDB global augmentation
declare global {
  var mongoose: any;
}
