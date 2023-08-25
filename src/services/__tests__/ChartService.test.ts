import { createChart } from '../ChartService'
import fs from 'fs'

import * as Vega from 'vega'

jest.mock('vega', () => ({
  View: jest.fn(),
  parse: jest.fn(),
}))

const View = Vega.View as jest.Mock
const parse = Vega.parse as jest.Mock
const toSVG = jest.fn(async () => null)
const initialize = jest.fn(() => ({
  toSVG,
}))

View.mockImplementation(function MockView() {
  this.initialize = initialize
})

describe('ChartService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('adds chart point data to the Vega schema', async () => {
    const now = new Date()
    await createChart(
      [
        {
          x: now,
          y: 0,
          c: 'To Do',
        },
        {
          x: now,
          y: 10,
          c: 'Done',
        },
      ],
      '100x100'
    )

    const schema = parse.mock.calls[0][0]

    expect(schema.data[0].values).toMatchObject([
      { x: now, y: 0, c: 'To Do' },
      { x: now, y: 10, c: 'Done' },
    ])
  })

  // Purposefully using snapshotting tests because these are painful to update if the color functions are tweaked.
  // Please inspect any snapshot changes closely to ensure the expected output is present.
  describe('sets column colors dynamically', () => {
    const createChartData = (columnNames: string[]) =>
      columnNames.map((columnName) => ({
        y: Math.round(Math.random() * 10),
        x: new Date(),
        c: columnName,
      }))

    it('1 columns', async () => {
      const data = createChartData(['Stuff'])

      await createChart(data, '100x100')

      const schema = parse.mock.calls[0][0]
      const columnColorScale = schema.scales.find(
        ({ type: scaleType }: { type: string }) => scaleType === 'ordinal'
      )
      expect(columnColorScale.range).toMatchInlineSnapshot(`
        Array [
          "#347D9D",
        ]
      `)
    })

    it('2 columns', async () => {
      const data = createChartData(['To Do', 'Done'])

      await createChart(data, '100x100')

      const schema = parse.mock.calls[0][0]
      const columnColorScale = schema.scales.find(
        ({ type: scaleType }: { type: string }) => scaleType === 'ordinal'
      )
      expect(columnColorScale.range).toMatchInlineSnapshot(`
        Array [
          "#EE4949",
          "#347D9D",
        ]
      `)
    })

    it('3 columns', async () => {
      const data = createChartData(['To Do', 'In Progress', 'Done'])

      await createChart(data, '100x100')

      const schema = parse.mock.calls[0][0]
      const columnColorScale = schema.scales.find(
        ({ type: scaleType }: { type: string }) => scaleType === 'ordinal'
      )

      expect(columnColorScale.range).toMatchInlineSnapshot(`
        Array [
          "#EE4949",
          "#49EE49",
          "#347D9D",
        ]
      `)
    })

    it('4 columns', async () => {
      const data = createChartData([
        'To Do',
        'In Progress',
        'In Review',
        'Done',
      ])

      await createChart(data, '100x100')

      const schema = parse.mock.calls[0][0]
      const columnColorScale = schema.scales.find(
        ({ type: scaleType }: { type: string }) => scaleType === 'ordinal'
      )

      expect(columnColorScale.range).toMatchInlineSnapshot(`
        Array [
          "#EE4949",
          "#EEDD49",
          "#49EE49",
          "#347D9D",
        ]
      `)
    })

    it('5 columns', async () => {
      const data = createChartData([
        'Triage',
        'To Do',
        'In Progress',
        'In Review',
        'Done',
      ])

      await createChart(data, '100x100')

      const schema = parse.mock.calls[0][0]
      const columnColorScale = schema.scales.find(
        ({ type: scaleType }: { type: string }) => scaleType === 'ordinal'
      )

      expect(columnColorScale.range).toMatchInlineSnapshot(`
        Array [
          "#EE4949",
          "#EE9C49",
          "#D9EE49",
          "#49EE49",
          "#347D9D",
        ]
      `)
    })

    it('make sure you update sample-burndown if you change the color scales', async () => {
      const burndownSvg = fs.readFileSync('docs/sample-burndown.svg', {
        encoding: 'utf-8',
      })

      const data = createChartData([
        'To Do',
        'In Progress',
        'In Review',
        'Done',
      ])

      await createChart(data, '100x100')

      const schema = parse.mock.calls[0][0]
      const columnColorScale = schema.scales.find(
        ({ type: scaleType }: { type: string }) => scaleType === 'ordinal'
      )

      columnColorScale.range.forEach((color: string) => {
        expect(burndownSvg).toContain(color)
      })
    })
  })

  it('has a vertical rule at "now"', async () => {
    await createChart([], '100x151')

    const schema = parse.mock.calls[0][0]

    const rule = schema.marks.find(
      ({ type: markType }: { type: string }) => markType === 'rule'
    )

    expect(rule.encode.enter).toMatchObject({
      x: {
        scale: 'x',
      },
      y: {
        value: 0,
      },
      y2: {
        value: 151,
      },
      strokeDash: {
        value: [10, 5],
      },
    })

    // within 500ms (in reality it sould stay within 1 or 2 ms)
    expect(rule.encode.enter.x.value).toBeCloseTo(Date.now(), -3)
  })

  it('converts height x width to proper height and width', async () => {
    await createChart([], '250x300')

    expect(parse).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 250,
        height: 300,
      })
    )
  })

  it('initializes a vega view', async () => {
    await createChart([], '100x100')

    expect(initialize).toHaveBeenCalled()
  })

  it('renders the Vega view to SVG', async () => {
    toSVG.mockResolvedValueOnce('<svg>Hi</svg>')

    const result = await createChart([], '100x100')

    expect(toSVG).toHaveBeenCalled()
    expect(result).toBe('<svg>Hi</svg>')
  })
})
