import { Fragment } from 'react'

const BOLD_PART = /(\*\*[^*\n]+\*\*)/g

type RichTextProps = {
  text: string
}

export default function RichText({ text }: RichTextProps) {
  return (
    <>
      {text.split(BOLD_PART).map((part, index) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={`${index}-${part}`} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={`${index}-${part}`}>{part}</Fragment>
        ),
      )}
    </>
  )
}
