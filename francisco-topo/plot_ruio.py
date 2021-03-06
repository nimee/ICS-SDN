"""Plot the solution that was generated by differential_equation.py."""
 
from numpy import loadtxt
from pylab import figure, plot, xlabel, grid, hold, legend, title, savefig
from matplotlib.font_manager import FontProperties
import sys

t, x1, xy = loadtxt(sys.argv[1] , unpack=True)


figure(1, figsize=(6, 4.5))

xlabel('t')
grid(True)
hold(True)
lw = 1

plot(t, x1, 'b', linewidth=lw)
plot(t, xy, 'r', linewidth=lw)

#legend((r'$L101$', r'$L102$', r'$L103$'), prop=FontProperties(size=16))
title('Tank Levels with Control')
savefig(sys.argv[2], dpi=100)
