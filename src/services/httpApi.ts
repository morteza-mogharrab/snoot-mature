import type { ApiClient, ServerEvent } from './api';
import type { Mutation } from './mutations';

/**
 * Reference client for a real REST + WebSocket backend. Not used by the demo:
 * switch `api` in api.ts to `createHttpApi(import.meta.env.VITE_API_URL, getToken)`.
 * Each mutation maps to one endpoint; server-originated ones arrive over the socket.
 */
export function createHttpApi(baseUrl: string, getToken: () => string | null): ApiClient {
  const request = async (method: string, path: string, body?: unknown) => {
    const token = getToken();
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
    return res.status === 204 ? null : res.json();
  };

  const route = (m: Mutation): [string, string, unknown?] => {
    switch (m.type) {
      case 'post/boop': return ['POST', `/posts/${m.postId}/boop`];
      case 'post/treat': return ['POST', `/posts/${m.postId}/treats`];
      case 'post/save': return ['POST', `/posts/${m.postId}/save`];
      case 'post/create': return ['POST', '/posts', m.post];
      case 'post/delete': return ['DELETE', `/posts/${m.postId}`];
      case 'comment/add': return ['POST', `/posts/${m.postId}/comments`, m.comment];
      case 'comment/like': return ['POST', `/posts/${m.postId}/comments/${m.commentId}/like`];
      case 'pet/follow': return ['POST', `/pets/${m.petId}/follow`];
      case 'pet/create': return ['POST', '/pets', m.pet];
      case 'pet/update': return ['PATCH', `/pets/${m.petId}`, m.patch];
      case 'pet/setActive': return ['PUT', '/me/active-pet', { petId: m.petId }];
      case 'story/seen': return ['POST', `/stories/${m.storyId}/seen`, { upTo: m.upTo }];
      case 'story/add': return ['POST', `/pets/${m.petId}/stories`, m.item];
      case 'walk/save': return ['POST', '/walks', m.walk];
      case 'place/checkIn': return ['POST', `/places/${m.placeId}/check-ins`];
      case 'place/save': return ['POST', `/places/${m.placeId}/save`];
      case 'place/review': return ['POST', `/places/${m.placeId}/reviews`, m.review];
      case 'event/rsvp': return ['PUT', `/events/${m.eventId}/rsvp`, { rsvp: m.rsvp, petId: m.petId }];
      case 'event/create': return ['POST', '/events', m.event];
      case 'pack/join': return ['POST', `/packs/${m.packId}/membership`, { petId: m.petId }];
      case 'dm/send': return ['POST', `/conversations/${m.conversationId}/messages`, m.message];
      case 'dm/start': return ['POST', '/conversations', m.conversation];
      case 'dm/read': return ['POST', `/conversations/${m.conversationId}/read`];
      case 'notifications/readAll': return ['POST', '/notifications/read'];
      case 'rewards/checkIn': return ['POST', '/rewards/check-in'];
      case 'rewards/spin': return ['POST', '/rewards/spin'];
      case 'rewards/coupon': return ['POST', '/rewards/coupons', { offerId: m.coupon.offerId }];
      case 'challenge/join': return ['POST', `/challenges/${m.challengeId}/join`];
      case 'contest/vote': return ['POST', `/contests/${m.contestId}/votes`, { entryId: m.entryId }];
      case 'contest/enter': return ['POST', `/contests/${m.contestId}/entries`, { petId: m.petId, postId: m.postId }];
      case 'lost/report': return ['POST', '/lost', m.alert];
      case 'lost/sighting': return ['POST', `/lost/${m.alertId}/sightings`];
      case 'lost/resolve': return ['POST', `/lost/${m.alertId}/resolve`];
      case 'adopt/favorite': return ['POST', `/adoption/${m.adoptId}/favorite`];
      case 'adopt/apply': return ['POST', `/adoption/${m.adoptId}/applications`];
      case 'memory/add': return ['POST', `/pets/${m.memory.petId}/memories`, m.memory];
      case 'diary/add': return ['POST', `/pets/${m.entry.petId}/diary`, m.entry];
      case 'album/addMedia': return ['POST', `/albums/${m.albumId}/media`, { src: m.src }];
      case 'settings/weeklyGoal': return ['PATCH', '/me/settings', { weeklyGoalKm: m.km }];
      // Computed server-side in production (rewards rules, badges, XP, challenge progress, pushes):
      case 'rewards/ledger': case 'pet/awardBadge': case 'pet/addXp': case 'challenge/progress':
      case 'dm/receive': case 'notifications/push':
        return ['NOOP', ''];
    }
  };

  return {
    bootstrap: () => request('GET', '/me/bootstrap'),
    async mutate(m) {
      const [method, path, body] = route(m);
      if (method !== 'NOOP') await request(method, path, body);
    },
    subscribe(listener) {
      const ws = new WebSocket(baseUrl.replace(/^http/, 'ws') + '/events');
      ws.onmessage = (e) => listener(JSON.parse(e.data) as ServerEvent);
      return () => ws.close();
    },
    async reset() {
      throw new Error('reset is only available in the mock API');
    },
  };
}
