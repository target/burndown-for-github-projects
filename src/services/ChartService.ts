import { View as VegaView, parse, Spec as VegaChartSpec } from 'vega'
import { ChartDimensions, ChartPoint } from '../types/Chart'
import { SprintSummary } from './SprintPointService'
import convert from 'color-convert'

export const createChart = async (
  data: ChartPoint[],
  dimensions: ChartDimensions
): Promise<string> => {
  const chartSpec = createSpec(data, dimensions)
  const view = new VegaView(parse(chartSpec), {
    renderer: 'none',
  }).initialize()

  const svg = await view.toSVG()

  return svg
}

const createSpec = (
  serieses: ChartPoint[],
  dimensions: ChartDimensions
): VegaChartSpec => {
  const [width, height] = dimensions.split('x').map((d) => Number(d))
  const columnCount = serieses.reduce((columnNames, { c: columnName }) => {
    if (!columnNames.includes(columnName)) {
      columnNames.push(columnName)
    }
    return columnNames
  }, []).length
  const columnColors = createColumnColors(columnCount)

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',

    // physical chart dimensions in pixels
    width,
    height,

    // data doesn't visually show on the chart in any way,
    // it only seems to drive how other sections of the schema (legend, marks, etc) render
    data: [
      {
        // this name "table" will be referenced later
        name: 'table',
        values: serieses,
        transform: [
          {
            // This stacks the graph's "y" values
            type: 'stack',
            groupby: ['x'],
            field: 'y',
          },
        ],
      },
      {
        name: 'maxy',
        source: 'table',
        // values: serieses,
        transform: [
          {
            type: 'aggregate',
            groupby: ['x'],
            fields: ['y'],
            ops: ['max'],
            as: ['b'],
          },
        ],
      },
    ],

    scales: [
      {
        // how big the horizontal scale of the chart goes
        name: 'x',

        // "time" is what makes it display points scaled by date
        // "point" would display points at even intervals
        type: 'time',

        // the whole chart wide
        range: 'width',

        // bounds are determined by the 'x' field from the input dataset "table"
        domain: {
          // I told you so
          data: 'table',
          field: 'x',
        },
      },

      {
        // how big the vertical scale of the chart goes
        name: 'y',
        type: 'linear',

        // the whole chart tall
        range: 'height',

        // round up a bit at the top so we have wiggle room
        nice: true,

        // start at 0
        zero: true,

        // bounds are determined by the highest 'y' value from input dataset "table"
        domain: {
          data: 'table',
          field: 'y1',
        },
      },

      {
        // This makes a scale that is an array of colors based on the 'c' (project column) field on the input dataset
        name: 'sprintcolumn',
        type: 'ordinal',
        // range: 'category',

        // Length? is determined by the 'c' (project column) field from dataset "table"
        domain: { data: 'table', field: 'c' },

        // Array of hex color values
        range: columnColors,
      },
    ],

    axes: [
      {
        // x-axis

        // based on values derived in the 'x' scale above
        scale: 'x',

        orient: 'bottom',
        zindex: 1,

        // Show a grid at weekly intervals
        grid: true,
        tickCount: 'week',
      },
      {
        // y-axis

        // based on values derived in the 'y' scale above
        scale: 'y',

        orient: 'left',
        zindex: 1,

        // Show a dim grid (default every 10 story points)
        grid: true,
        gridOpacity: 0.25,
      },
    ],

    legends: [
      {
        // Show a legend mapping sprint column names to their corresponding area colors
        fill: 'sprintcolumn',
        values: {
          // reverse so the values align with the stacked series next to them
          signal: "reverse(domain('sprintcolumn'))",
        },
      },
    ],

    marks: [
      // Marks are the physical stuff on the chart.
      {
        // Group up the table data by value 'c' (project column name)
        type: 'group',
        from: {
          facet: {
            // This 'series' name will be referenced below to make marks from.
            name: 'series',
            data: 'table',
            groupby: 'c',
          },
        },
        marks: [
          {
            // Show an area based on the grouping created above.
            type: 'area',
            from: { data: 'series' },
            encode: {
              enter: {
                // This makes filled areas based on the dataset
                x: { scale: 'x', field: 'x' },
                y: { scale: 'y', field: 'y0' },
                y2: { scale: 'y', field: 'y1' },
                fill: { scale: 'sprintcolumn', field: 'c' },
              },
            },
          },
        ],
      },
      {
        // This is the black vertical line at today's date. Think like a "horizontal rule", but vertical.
        type: 'rule',
        encode: {
          enter: {
            x: {
              // Show it at today's date
              value: Date.now(),
              // Show it based on the 'x' scale.
              // Otherwise, there's no reference to where today or any date even is on the chart.
              scale: 'x',
            },
            y: {
              // Show the line from the very top of the chart
              value: 0,
            },
            y2: {
              // Show the line all the way down to the bottom of the chart
              value: height,
            },
            // dashed line
            strokeDash: {
              value: [10, 5],
            },
          },
        },
      },
    ],
  }
}

/**
 * Produces an array of colors from red to green, plus a final blue.
 */
const createColumnColors = (columnCount: number) => {
  const redHue = 0
  const blueHue = 198 // It's cyan-ish

  const columnColors = new Array(columnCount).fill(null).map((_, index) => {
    // Last column is blue.
    if (index === columnCount - 1) {
      return hsl2hex(blueHue, 50, 41)
    }

    // First column is red UNLESS it is the only column (blue comes beforehand).
    if (index === 0) {
      return hsl2hex(redHue)
    }

    const step = 1 / (columnCount - 1)
    const hue = redShift(Math.round((index + 1) * step * 100))
    return hsl2hex(hue)
  })

  return columnColors
}

/**
 * Shifts middle values downwards to create a more red-orange-yellow-green spread
 * than using hues directly, which creates a red-yellow-green spread.
 *
 * 0 = 0 (red)
 * 50 ~= 31 (orange)
 * 100 ~= 120 (green)
 */
const redShift = (base: number) => Math.pow(base, 2) * 0.012

const hsl2hex = (hue: number, saturation = 83, luminosity = 61) =>
  `#${convert.hsl.hex([hue, saturation, luminosity])}`

export const mapSprintToChartPoints = (
  sprintData: SprintSummary
): ChartPoint[] => {
  const now = new Date()
  const chartData: ChartPoint[] = Object.entries(sprintData.columns).map(
    ([columnName, { storyPoints }]) => ({
      x: now,
      y: storyPoints,
      c: columnName,
    })
  )
  return chartData
}
