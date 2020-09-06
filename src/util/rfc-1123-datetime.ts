export function getRFC1123DateTime() {
  var nowDate = new Date()
  var weekday = getWeekday(nowDate.getDay())
  var day = formatTwoDigits(nowDate.getDate())
  var month = getMonthWord(nowDate.getMonth())
  var year = nowDate.getUTCFullYear()
  var hours = formatTwoDigits(nowDate.getUTCHours())
  var minutes = formatTwoDigits(nowDate.getUTCMinutes())
  var seconds = formatTwoDigits(nowDate.getUTCSeconds())

  return (
    weekday +
    ', ' +
    day +
    ' ' +
    month +
    ' ' +
    year +
    ' ' +
    hours +
    ':' +
    minutes +
    ':' +
    seconds +
    ' GMT'
  )
}

function getWeekday(idx: number) {
  var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return weekdays[idx]
}

function getMonthWord(idx: number) {
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[idx]
}

function formatTwoDigits(str: number) {
  return ('00' + str).slice(-2)
}
