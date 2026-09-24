import PersonPoll from '@/components/person/PersonPoll';

/** Poll of the day inside the feed (reuses the person poll; renders nothing if the poll is gone) */
export default function PollModule({ slug }: { slug: string }) {
  return (
    <PersonPoll
      slug={slug}
      label="🗳 Poll of the Day"
      moreLink={{ href: `/persons/${slug}`, text: 'About this figure →' }}
    />
  );
}
