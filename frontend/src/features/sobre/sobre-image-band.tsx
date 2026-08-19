const BAND_IMAGE =
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1920&q=80";
export function SobreImageBand() {
  return (
    <section aria-hidden>
      <div
        role="img"
        aria-label="Sala de aula moderna com tecnologia integrada"
        className="h-[60vh] min-h-[420px] w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${BAND_IMAGE})` }}
      />
      
    </section>
  );
}
