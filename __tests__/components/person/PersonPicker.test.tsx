import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import PersonPicker from '@/components/person/PersonPicker';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

const mockPersons = [
  { id: '1', slug: 'sejong', name_en: 'Sejong', thumbnail: null },
  {
    id: '2',
    slug: 'yi-sun-sin',
    name_en: 'Yi Sun-sin',
    thumbnail: 'https://example.supabase.co/photo.webp',
  },
];

describe('PersonPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('renders search input when no value', () => {
    render(<PersonPicker value={null} onChange={() => {}} />);

    expect(
      screen.getByPlaceholderText('Search for a historical figure...')
    ).toBeInTheDocument();
    expect(screen.getByText('Figure')).toBeInTheDocument();
  });

  it('renders selected person badge when value is set', () => {
    const person = {
      id: '1',
      slug: 'sejong',
      name_en: 'Sejong',
      thumbnail: null,
    };
    render(<PersonPicker value={person} onChange={() => {}} />);

    expect(screen.getByText('Sejong')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Search for a historical figure...')
    ).not.toBeInTheDocument();
  });

  it('calls onChange(null) when clearing selection', () => {
    const onChange = vi.fn();
    const person = {
      id: '1',
      slug: 'sejong',
      name_en: 'Sejong',
      thumbnail: null,
    };
    render(<PersonPicker value={person} onChange={onChange} />);

    fireEvent.click(screen.getByText('✕'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('searches and shows results on typing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({ success: true, data: { persons: mockPersons } }),
    });

    render(<PersonPicker value={null} onChange={() => {}} />);

    const input = screen.getByPlaceholderText(
      'Search for a historical figure...'
    );
    fireEvent.change(input, { target: { value: 'sej' } });

    // Advance past debounce timer
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search/suggest?q=sej&limit=6'
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Sejong')).toBeInTheDocument();
      expect(screen.getByText('Yi Sun-sin')).toBeInTheDocument();
    });
  });

  it('calls onChange with selected person from results', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({ success: true, data: { persons: mockPersons } }),
    });

    const onChange = vi.fn();
    render(<PersonPicker value={null} onChange={onChange} />);

    const input = screen.getByPlaceholderText(
      'Search for a historical figure...'
    );
    fireEvent.change(input, { target: { value: 'sej' } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Sejong')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sejong'));

    expect(onChange).toHaveBeenCalledWith(mockPersons[0]);
  });

  it('shows "No figures found" when search returns empty', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({ success: true, data: { persons: [] } }),
    });

    render(<PersonPicker value={null} onChange={() => {}} />);

    const input = screen.getByPlaceholderText(
      'Search for a historical figure...'
    );
    fireEvent.change(input, { target: { value: 'zzz' } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('No figures found')).toBeInTheDocument();
    });
  });

  it('does not search when input is empty', () => {
    global.fetch = vi.fn();
    render(<PersonPicker value={null} onChange={() => {}} />);

    const input = screen.getByPlaceholderText(
      'Search for a historical figure...'
    );
    fireEvent.change(input, { target: { value: '' } });

    vi.advanceTimersByTime(300);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
