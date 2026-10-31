/** Actores de mundo y sus instancias presentes, sin confundir tokens no vinculados con su base. */
export function actoresPresentes(){
 const lista=x=>Array.from(x?.contents??x?.values?.()??x??[]),todos=[...lista(game.actors)];
 for(const c of lista(game.combats))for(const t of lista(c.combatants))if(t.actor)todos.push(t.actor);
 for(const t of lista(globalThis.canvas?.tokens?.placeables))if(t.actor)todos.push(t.actor);
 return [...new Map(todos.filter(Boolean).map(a=>[a.uuid??a.id,a])).values()];
}
