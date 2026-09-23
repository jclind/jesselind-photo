import { siteUrl } from '@/lib/siteUrl'

export const EMAIL = 'jesselindphoto@gmail.com'
export const PERSONAL_WEBSITE = 'jesselind.com'
export const PHOTO_WEBSITE_URL = siteUrl
export const CONTACT_LINKS = [
  {
    label: 'Email',
    value: EMAIL,
    link: `mailto:${EMAIL}`,
  },
  { label: 'Github', value: '@jclind', link: 'https://github.com/jclind' },
  {
    label: 'Website',
    value: PERSONAL_WEBSITE,
    link: `https://${PERSONAL_WEBSITE}/`,
  },
  {
    label: 'Instagram',
    value: '@jesselindphoto',
    link: 'https://www.instagram.com/jesselindphoto',
  },
  {
    label: 'Support Me',
    value: '@jesseclind',
    link: 'https://buymeacoffee.com/jesseclind',
  },
]
