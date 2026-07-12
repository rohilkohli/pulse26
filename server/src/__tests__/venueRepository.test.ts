import { StaticVenueRepository } from '../infrastructure/venueRepository';

describe('StaticVenueRepository', () => {
  it('should return null for non-existent venue', async () => {
    const repo = new StaticVenueRepository();
    const result = await repo.getVenueLayout('unknown');
    expect(result).toBeNull();
  });

  it('should return a valid layout for metlife', async () => {
    const repo = new StaticVenueRepository();
    const result = await repo.getVenueLayout('metlife');
    expect(result).not.toBeNull();
    expect(result?.venueId).toBe('metlife');
    expect(result?.zones.length).toBeGreaterThan(0);
  });
});
