import Prismic from 'prismic-javascript'
import dom from 'prismic-dom'
import getPrismicApi from '@/datalayer/helpers/getPrismicApi'
import { asDay, asMonth, asYear, asLink } from '@/datalayer/helpers/modifiers'

export const handler = async (context) => {
  const api = await getPrismicApi()

  const result = await api.getSingle('speaking')

  const document = {
    title: dom.RichText.asText(result.data.title),
    upcoming_talks: dom.RichText.asText(result.data.upcoming_talks),
    no_upcoming: dom.RichText.asText(result.data.no_upcoming),
    older_talks: dom.RichText.asText(result.data.older_talks),
    ...result,
  }

  const talksData = await api.query(
    Prismic.Predicates.at('document.type', 'talk'),
    { orderings: '[my.talk.publication_date desc]', pageSize: 100 }
  )

  const talks = talksData.results.map((talk) => {
    return {
      uid: talk.uid,
      date: talk.data.date,
      day: asDay(talk.data.date),
      month: asMonth(talk.data.date),
      year: asYear(talk.data.date),
      link_to_event: asLink(talk.data.link_to_event),
      title: dom.RichText.asText(talk.data.title),
      location: talk.data.location,
      subject: talk.data.subject,
    }
  })

  const oldTalks = []
  const upcomingTalks = []

  const isDateBeforeToday = (date) => {
    return new Date(date.toDateString()) < new Date(new Date().toDateString())
  }

  talks.forEach((talk) => {
    if (isDateBeforeToday(new Date(talk.date))) {
      oldTalks.push(talk)
    } else {
      upcomingTalks.push(talk)
    }
  })

  oldTalks.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  upcomingTalks.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  const metaInfo = {
    fields: document.data,
    pageType: 'speaking',
  }

  return {
    document,
    oldTalks,
    upcomingTalks,
    metaInfo,
  }
}
