import { ContatoForm } from "./contato-form";
import { ContatoSideArt } from "./contato-side-art";

export function ContatoSection() {
  return (
    <section className="bg-white py-24 font-body text-wpa-darker md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          <ContatoForm />
          <ContatoSideArt />
        </div>
      </div>
    </section>
  );
}
