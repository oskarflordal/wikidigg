import re

titleidx = {}
wikifile = "Z:\wiki.xml"


def index(str, pos):
    if str.find("<title>") != -1:
        a = str.split(">")[1].split("<")[0]
        titleidx[a] = [pos, 0]

refpattern = re.compile("")


def countref(args):
    spl = args.split("|")
    if spl[0] in titleidx:
        titleidx[spl[0]][1] += 1


def refcount(str, pos):
    rep = "a" + str.replace("]]", "[[")
    m = rep.split("[[")
    if (len(m) != 1):
        map(countref, m[1::2])


def go_through_file(func):
    linenum = 0
    with open(wikifile) as infile:
        for line in infile:
            func(line, linenum)
            linenum += 1


go_through_file(index)
go_through_file(refcount)


a = sorted(titleidx.items(), key=lambda x: (x[1][1]), reverse=True)


def printentry(args):
    print args
    print "" + str(args[1][1]) + " " +args[0]


map(printentry, a[0:99])