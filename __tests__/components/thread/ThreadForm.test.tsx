import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ThreadForm from '@/components/thread/ThreadForm';

// ── Mocks ──

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockToast = vi.fn();
vi.mock('@/components/common/Toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/components/common/ImageUpload', () => ({
  default: () => <div data-testid="image-upload" />,
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

const mockApiFetch = vi.fn();
vi.mock('@/lib/fetcher', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// Mock PersonPicker — simulate selecting a person
let pickerOnChange: ((p: unknown) => void) | null = null;
vi.mock('@/components/person/PersonPicker', () => ({
  default: ({
    value,
    onChange,
  }: {
    value: unknown;
    onChange: (p: unknown) => void;
  }) => {
    pickerOnChange = onChange;
    return (
      <div data-testid="person-picker">
        {value ? 'selected' : 'none'}
        <input
          data-testid="person-search"
          placeholder="Search for a historical figure..."
          onChange={() => {}}
        />
      </div>
    );
  },
}));

// ── Helpers ──

function fillForm(title: string, content: string) {
  fireEvent.change(screen.getByPlaceholderText('Enter a title'), {
    target: { value: title },
  });
  fireEvent.change(screen.getByPlaceholderText('Share your thoughts...'), {
    target: { value: content },
  });
}

function selectPerson() {
  pickerOnChange?.({
    id: 'person-uuid-1',
    slug: 'sejong',
    name_en: 'Sejong',
    thumbnail: null,
  });
}

function selectAnotherPerson() {
  pickerOnChange?.({
    id: 'person-uuid-2',
    slug: 'jeong-dojeon',
    name_en: 'Jeong Do-jeon',
    thumbnail: null,
  });
}

// ── Tests ──

describe('ThreadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pickerOnChange = null;
  });

  describe('when personId is provided (from person detail page)', () => {
    it('shows fixed person name and allows adding related persons', () => {
      render(<ThreadForm personId="uuid-1" personName="Sejong" />);

      expect(screen.getByText('Sejong')).toBeInTheDocument();
      expect(screen.getByTestId('person-picker')).toBeInTheDocument();
    });

    it('submits with the provided personId', async () => {
      mockApiFetch.mockResolvedValueOnce({ id: 'thread-1' });
      render(<ThreadForm personId="uuid-1" personName="Sejong" />);

      fillForm('Test Title', 'Test content body');
      fireEvent.click(screen.getByRole('button', { name: 'Post Thread' }));

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith('/api/threads', {
          method: 'POST',
          body: JSON.stringify({
            figures: ['uuid-1'],
            title: 'Test Title',
            content: 'Test content body',
          }),
        });
      });
    });
  });

  describe('when personId is NOT provided (from /threads/new)', () => {
    it('renders PersonPicker', () => {
      render(<ThreadForm />);

      expect(screen.getByTestId('person-picker')).toBeInTheDocument();
      expect(screen.queryByText('— Thread')).not.toBeInTheDocument();
    });

    it('disables submit button when no person is selected', () => {
      render(<ThreadForm />);
      fillForm('Title', 'Content');

      const btn = screen.getByRole('button', { name: 'Post Thread' });
      expect(btn).toBeDisabled();
    });

    it('shows error toast when submitting without person', () => {
      render(<ThreadForm />);
      fillForm('Title', 'Content');

      // Force submit via form (button is disabled, so submit the form directly)
      const form = screen.getByRole('button', { name: 'Post Thread' })
        .closest('form')!;
      fireEvent.submit(form);

      expect(mockToast).toHaveBeenCalledWith(
        'Please select at least one figure',
        'error'
      );
      expect(mockApiFetch).not.toHaveBeenCalled();
    });

    it('enables submit after selecting a person', () => {
      render(<ThreadForm />);
      fillForm('Title', 'Content');

      // Before selection — disabled
      expect(
        screen.getByRole('button', { name: 'Post Thread' })
      ).toBeDisabled();

      // Select person
      act(() => {
        selectPerson();
      });

      // After selection — enabled
      expect(
        screen.getByRole('button', { name: 'Post Thread' })
      ).not.toBeDisabled();
    });

    it('submits with selected person id', async () => {
      mockApiFetch.mockResolvedValueOnce({ id: 'thread-2' });
      render(<ThreadForm />);

      selectPerson();
      fillForm('Discussion about Sejong', 'Great king');
      fireEvent.click(screen.getByRole('button', { name: 'Post Thread' }));

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith('/api/threads', {
          method: 'POST',
          body: JSON.stringify({
            figures: ['person-uuid-1'],
            title: 'Discussion about Sejong',
            content: 'Great king',
          }),
        });
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/threads/thread-2');
      });
    });

    it('submits multiple selected persons as figures in order', async () => {
      mockApiFetch.mockResolvedValueOnce({ id: 'thread-4' });
      render(<ThreadForm />);

      act(() => {
        selectPerson();
      });
      act(() => {
        selectAnotherPerson();
      });
      fillForm('Discussion about reforms', 'Multiple figures involved');
      fireEvent.click(screen.getByRole('button', { name: 'Post Thread' }));

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith('/api/threads', {
          method: 'POST',
          body: JSON.stringify({
            figures: ['person-uuid-1', 'person-uuid-2'],
            title: 'Discussion about reforms',
            content: 'Multiple figures involved',
          }),
        });
      });
    });
  });

  describe('validation', () => {
    it('shows error for empty title/content', () => {
      render(<ThreadForm personId="uuid-1" personName="Sejong" />);

      const form = screen.getByRole('button', { name: 'Post Thread' })
        .closest('form')!;
      fireEvent.submit(form);

      expect(mockToast).toHaveBeenCalledWith(
        'Please enter a title and content',
        'error'
      );
    });

    it('shows error for invalid video URL', () => {
      render(<ThreadForm personId="uuid-1" personName="Sejong" />);
      fillForm('Title', 'Content');

      fireEvent.change(
        screen.getByPlaceholderText('YouTube or Naver TV URL'),
        { target: { value: 'https://example.com/video' } }
      );
      fireEvent.click(screen.getByRole('button', { name: 'Post Thread' }));

      expect(mockToast).toHaveBeenCalledWith(
        'Only YouTube or Naver TV URLs are allowed',
        'error'
      );
    });

    it('accepts valid YouTube URL', async () => {
      mockApiFetch.mockResolvedValueOnce({ id: 'thread-3' });
      render(<ThreadForm personId="uuid-1" personName="Sejong" />);
      fillForm('Title', 'Content');

      fireEvent.change(
        screen.getByPlaceholderText('YouTube or Naver TV URL'),
        { target: { value: 'https://www.youtube.com/watch?v=abc123' } }
      );
      fireEvent.click(screen.getByRole('button', { name: 'Post Thread' }));

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith('/api/threads', {
          method: 'POST',
          body: JSON.stringify({
            figures: ['uuid-1'],
            title: 'Title',
            content: 'Content',
            video_url: 'https://www.youtube.com/watch?v=abc123',
          }),
        });
      });
    });
  });
});
