import { MDXRemote } from "next-mdx-remote"
import { serialize } from "next-mdx-remote/serialize"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeHighlight from "rehype-highlight"
import rehypeSlug from "rehype-slug"
import { notFound } from "next/navigation"

import { getDocFromParams } from "@/utils/mdx"

interface Props {
  params: {
    slug: string[]
  }
}

export default async function DocPage({ params }: Props) {
  const { content, frontmatter } = await getDocFromParams(params.slug)

  if (!content) {
    notFound()
  }

  const mdxSource = await serialize(content, {
    mdxOptions: {
      rehypePlugins: [rehypeHighlight, rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
    },
  })

  return (
    <div className="wrapper">
      <h1>{frontmatter.title}</h1>
      <MDXRemote {...mdxSource} />
    </div>
  )
}
